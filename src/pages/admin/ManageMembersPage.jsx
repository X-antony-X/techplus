import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';

const ROLES = ['student', 'teacher', 'lecturer', 'admin'];

const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return '';

  // تحويل الرقم المصري من 01xxxxxxxxx إلى 201xxxxxxxxx
  let number = String(phone).replace(/\D/g, '');

  if (number.startsWith('0')) {
    number = `20${number.slice(1)}`;
  } else if (number.startsWith('1') && number.length === 10) {
    number = `20${number}`;
  }

  return number;
};

export default function ManageMembersPage() {
  const [members, setMembers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        { data: membersData, error: membersError },
        { data: coursesData, error: coursesError },
        { data: enrollmentsData, error: enrollmentsError },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, phone_number, role')
          .order('created_at', { ascending: false }),

        supabase
          .from('courses')
          .select('id, title, price, status')
          .order('title'),

        supabase
          .from('enrollments')
          .select('id, user_id, course_id, status, enrolled_at, expires_at'),
      ]);

      if (membersError) throw membersError;
      if (coursesError) throw coursesError;
      if (enrollmentsError) throw enrollmentsError;

      setMembers(membersData || []);
      setCourses(coursesData || []);
      setEnrollments(enrollmentsData || []);
    } catch (err) {
      console.error('Fetch members error:', err);
      setError(err.message || 'Unable to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMembers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return members;

    return members.filter((member) =>
      [
        member.full_name,
        member.email,
        member.phone_number,
        member.role,
      ].some((item) => String(item || '').toLowerCase().includes(value))
    );
  }, [members, search]);

  const getMemberCourses = (memberId) => {
    return enrollments
      .filter(
        (enrollment) =>
          enrollment.user_id === memberId &&
          enrollment.status === 'active'
      )
      .map((enrollment) => ({
        ...enrollment,
        course: courses.find(
          (course) => course.id === enrollment.course_id
        ),
      }))
      .filter((item) => item.course);
  };

  const handleRoleChange = async (member, newRole) => {
    if (!ROLES.includes(newRole)) return;

    const confirmed = window.confirm(
      `Are you sure you want to change ${member.full_name || member.email}'s role to ${newRole}?`
    );

    if (!confirmed) return;

    setActionLoading(`role-${member.id}`);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', member.id);

      if (updateError) throw updateError;

      setSuccess('Member role updated successfully.');
      await fetchData();
    } catch (err) {
      console.error('Update member role error:', err);
      setError(err.message || 'Unable to update member role.');
    } finally {
      setActionLoading('');
    }
  };


const handleGrantCourse = async (memberId, courseId) => {
  if (!memberId || !courseId) return;

  setActionLoading(`grant-${memberId}-${courseId}`);
  setError('');
  setSuccess('');

  try {
    // Check admin permission
    const { data: adminCheck, error: adminError } =
      await supabase.rpc('is_admin');

    console.log('Admin before grant:', adminCheck);
    console.log('Admin RPC error:', adminError);
    console.log('Member ID:', memberId);
    console.log('Course ID:', courseId);

    if (adminError) throw adminError;

    if (!adminCheck) {
      throw new Error('Your account is not recognized as an admin.');
    }

    // Check existing enrollment
    const { data: existing, error: checkError } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', memberId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      console.log('Existing enrollment:', existing);

      const { error: updateError } = await supabase
        .from('enrollments')
        .update({
          status: 'active',
          expires_at: null,
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;

      console.log('Enrollment updated successfully.');
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('enrollments')
        .insert({
          user_id: memberId,
          course_id: courseId,
          status: 'active',
          expires_at: null,
        })
        .select('id, user_id, course_id, status')
        .single();

      console.log('Inserted enrollment:', inserted);
      console.log('Insert error:', insertError);

      if (insertError) throw insertError;
    }

    setSuccess('Course access granted successfully.');
    await fetchData();
  } catch (err) {
    console.error('Grant course error:', err);
    setError(err.message || 'Unable to grant course access.');
  } finally {
    setActionLoading('');
  }
};


  const handleRevokeCourse = async (enrollment) => {
    const confirmed = window.confirm(
      'Are you sure you want to revoke this member’s access to the course?'
    );

    if (!confirmed) return;

    setActionLoading(`revoke-${enrollment.id}`);
    setError('');
    setSuccess('');

    try {
      const { error: deleteError } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollment.id);

      if (deleteError) throw deleteError;

      setSuccess('Course access revoked successfully.');
      await fetchData();
    } catch (err) {
      console.error('Revoke course error:', err);
      setError(err.message || 'Unable to revoke course access.');
    } finally {
      setActionLoading('');
    }
  };

  const openWhatsApp = (phone) => {
    const number = formatPhoneForWhatsApp(phone);

    if (!number) {
      setError('This member does not have a valid phone number.');
      return;
    }

    window.open(`https://wa.me/${number}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Members</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage members, roles, and course access.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Members</p>
          <p className="mt-2 text-2xl font-bold">{members.length}</p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Teachers</p>
          <p className="mt-2 text-2xl font-bold">
            {members.filter((member) => member.role === 'teacher').length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Students</p>
          <p className="mt-2 text-2xl font-bold">
            {members.filter((member) => member.role === 'student').length}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="rounded-xl border bg-white p-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, phone, or role..."
          className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-cyan-600"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">
          Loading members...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          No members found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => {
            const memberCourses = getMemberCourses(member.id);
            const isSelected = selectedMember?.id === member.id;

            return (
              <div
                key={member.id}
                className="overflow-hidden rounded-xl border bg-white"
              >
                <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {member.full_name || 'No name'}
                    </h3>

                    <p className="mt-1 break-all text-sm text-gray-500">
                      {member.email || 'No email'}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {member.phone_number || 'No phone number'}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {memberCourses.length} active course
                      {memberCourses.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={member.role || 'student'}
                      disabled={actionLoading === `role-${member.id}`}
                      onChange={(event) =>
                        handleRoleChange(member, event.target.value)
                      }
                      className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-cyan-600"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => openWhatsApp(member.phone_number)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedMember(isSelected ? null : member)
                      }
                      className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800"
                    >
                      {isSelected ? 'Close Courses' : 'Manage Courses'}
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <div className="space-y-4 border-t bg-gray-50 p-5">
                    <h4 className="font-semibold text-gray-900">
                      Course Access
                    </h4>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        id={`course-${member.id}`}
                        defaultValue=""
                        className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm"
                      >
                        <option value="" disabled>
                          Select a course to grant access
                        </option>

                        {courses
                          .filter((course) => Number(course.price) > 0)
                          .map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const select = document.getElementById(
                            `course-${member.id}`
                          );

                          if (select?.value) {
                            handleGrantCourse(member.id, select.value);
                          } else {
                            setError('Please select a course first.');
                          }
                        }}
                        disabled={actionLoading.startsWith(`grant-${member.id}-`)}
                        className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:opacity-50"
                      >
                        Grant Access
                      </button>
                    </div>

                    <div>
                      <h5 className="mb-3 text-sm font-semibold text-gray-700">
                        Active Courses
                      </h5>

                      {memberCourses.length === 0 ? (
                        <p className="rounded-lg border bg-white p-4 text-sm text-gray-500">
                          This member has no active courses.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {memberCourses.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {item.course.title}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Status: {item.status}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRevokeCourse(item)}
                                disabled={actionLoading === `revoke-${item.id}`}
                                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                Revoke Access
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}