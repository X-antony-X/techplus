import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// تشغيل السكربت من أي مكان سيبني الملفات داخل المشروع نفسه.
const structure = {
  public: ['favicon.svg', 'icons.svg'],
  'src/app': ['router.jsx', 'queryClient.js', 'AppProviders.jsx'],
  'src/assets/images': [],
  'src/assets/icons': [],
  'src/components/ui': [
    'Button.jsx',
    'Input.jsx',
    'Modal.jsx',
    'Loader.jsx',
    'Skeleton.jsx',
    'EmptyState.jsx',
    'StatusBadge.jsx',
  ],
  'src/components/layout': [
    'Navbar.jsx',
    'Footer.jsx',
    'DashboardLayout.jsx',
    'AdminLayout.jsx',
  ],
  'src/components/course': ['CourseCard.jsx', 'CourseHero.jsx', 'LessonList.jsx'],
  'src/components/payment': [
    'PaymentStatus.jsx',
    'UploadReceipt.jsx',
    'VodafoneCashInstructions.jsx',
  ],
  'src/features/auth': ['auth.api.js', 'auth.hooks.js', 'auth.utils.js'],
  'src/features/courses': ['courses.api.js', 'courses.hooks.js', 'course.utils.js'],
  'src/features/enrollment': ['enrollment.api.js', 'enrollment.hooks.js'],
  'src/features/payments': ['payments.api.js', 'payments.hooks.js'],
  'src/features/lessons': ['lessons.api.js', 'lessons.hooks.js'],
  'src/features/admin': ['admin.api.js', 'admin.hooks.js'],
  'src/pages': [
    'HomePage.jsx',
    'CoursesPage.jsx',
    'CourseDetailsPage.jsx',
    'LoginPage.jsx',
    'RegisterPage.jsx',
    'CheckoutPage.jsx',
    'PaymentPendingPage.jsx',
    'MyCoursesPage.jsx',
    'CoursePlayerPage.jsx',
    'NotFoundPage.jsx',
  ],
  'src/pages/admin': [
    'AdminDashboardPage.jsx',
    'PaymentRequestsPage.jsx',
    'ManageCoursesPage.jsx',
    'ManageLessonsPage.jsx',
  ],
  'src/routes': ['ProtectedRoute.jsx', 'AdminRoute.jsx', 'EnrollmentRoute.jsx'],
  'src/lib': ['supabase.js', 'apiClient.js'],
  'src/utils': ['constants.js', 'formatters.js', 'storage.js'],
  src: ['App.jsx', 'main.jsx', 'index.css', 'siteSetting.js'],
  'server/src/config': ['env.js', 'supabaseAdmin.js'],
  'server/src/controllers': [
    'payment.controller.js',
    'course.controller.js',
    'lesson.controller.js',
    'admin.controller.js',
  ],
  'server/src/middleware': ['requireAuth.js', 'requireAdmin.js', 'errorHandler.js'],
  'server/src/routes': [
    'payment.routes.js',
    'course.routes.js',
    'lesson.routes.js',
    'admin.routes.js',
  ],
  'server/src/services': [
    'payment.service.js',
    'enrollment.service.js',
    'video.service.js',
  ],
  'server/src/utils': ['appError.js'],
  'server/src': ['app.js', 'server.js'],
  server: ['.env.example', 'package.json'],
  'supabase/migrations': ['001_initial_schema.sql'],
  supabase: ['seed.sql'],
  '.': ['.env.example'],
};

const specialTemplates = {
  'src/main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
  'src/App.jsx': `const App = () => {
  return <main>Course platform</main>;
};

export default App;
`,
  'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
  'src/siteSetting.js': `export const siteSetting = {
  name: 'Course Platform',
};
`,
  'server/src/server.js': `import app from './app.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(\`API is running on port \${port}\`);
});
`,
  'server/src/app.js': `import express from 'express';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
`,
  'server/.env.example': `PORT=4000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
`,
  '.env.example': `VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:4000
`,
  'server/package.json': `{
  "name": "course-platform-api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js"
  }
}
`,
  'supabase/migrations/001_initial_schema.sql': `-- ضع هنا جداول profiles, courses, lessons, payment_requests و enrollments.\n`,
  'supabase/seed.sql': `-- بيانات تجريبية اختيارية.\n`,
};

const toIdentifier = (fileName) => {
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const parts = baseName.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const identifier = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return identifier || 'Component';
};

const getContent = (relativePath, fileName) => {
  if (specialTemplates[relativePath]) return specialTemplates[relativePath];

  if (fileName.endsWith('.jsx')) {
    const componentName = toIdentifier(fileName);

    return `const ${componentName} = () => {
  return <div>${componentName}</div>;
};

export default ${componentName};
`;
  }

  if (fileName.endsWith('.sql')) return '-- Add SQL here.\n';
  if (fileName.endsWith('.svg')) return '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n';
  if (fileName === 'package.json') return '{}\n';

  return `// ${fileName}\n`;
};

let createdFiles = 0;
let skippedFiles = 0;

Object.entries(structure).forEach(([folder, files]) => {
  const absoluteFolder = path.join(projectRoot, folder);
  fs.mkdirSync(absoluteFolder, { recursive: true });

  const componentFiles = files.filter((file) => file.endsWith('.jsx'));
  const shouldCreateBarrel =
    componentFiles.length > 0 &&
    !folder.includes('pages') &&
    !folder.endsWith('/app') &&
    !folder.endsWith('/routes');

  files.forEach((file) => {
    const relativePath = path.posix.join(folder, file);
    const filePath = path.join(absoluteFolder, file);

    if (fs.existsSync(filePath)) {
      skippedFiles += 1;
      return;
    }

    fs.writeFileSync(filePath, getContent(relativePath, file), 'utf8');
    createdFiles += 1;
  });

  if (shouldCreateBarrel) {
    const indexPath = path.join(absoluteFolder, 'index.js');

    if (!fs.existsSync(indexPath)) {
      const exports = componentFiles
        .map((file) => {
          const name = toIdentifier(file);
          return `export { default as ${name} } from './${file.replace('.jsx', '')}';`;
        })
        .join('\n');

      fs.writeFileSync(indexPath, `${exports}\n`, 'utf8');
      createdFiles += 1;
    }
  }
});

console.log(`✅ Structure is ready: ${createdFiles} file(s) created, ${skippedFiles} kept as-is.`);
