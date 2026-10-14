import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import StudentLayout from './layouts/StudentLayout.jsx';
import TeacherLayout from './layouts/TeacherLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import ApprovedTeacherRoute from './components/ApprovedTeacherRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Courses from './pages/Courses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import Status from './pages/Status.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Design from './pages/Design.jsx';
import NotFound from './pages/NotFound.jsx';
import StudentHome from './pages/student/StudentHome.jsx';
import StudentCourses from './pages/student/StudentCourses.jsx';
import LessonReader from './pages/student/LessonReader.jsx';
import Bookmarks from './pages/student/Bookmarks.jsx';
import Profile from './pages/student/Profile.jsx';
import Notes from './pages/student/Notes.jsx';
import Certificates from './pages/student/Certificates.jsx';
import MyReport from './pages/student/MyReport.jsx';
import VerifyCertificate from './pages/VerifyCertificate.jsx';
import TeacherHome from './pages/teacher/TeacherHome.jsx';
import MyCourses from './pages/teacher/MyCourses.jsx';
import CourseForm from './pages/teacher/CourseForm.jsx';
import CourseManage from './pages/teacher/CourseManage.jsx';
import LessonEditor from './pages/teacher/LessonEditor.jsx';
import QuizEditor from './pages/teacher/QuizEditor.jsx';
import LessonDiscussion from './pages/teacher/LessonDiscussion.jsx';
import StudentProgressPage from './components/report/StudentProgressPage.jsx';
import StudentDetailPage from './components/report/StudentDetailPage.jsx';
import CashOrders from './pages/teacher/CashOrders.jsx';
import AdminHome from './pages/admin/AdminHome.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminCourses from './pages/admin/AdminCourses.jsx';
import AdminAdmins from './pages/admin/AdminAdmins.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminFinance from './pages/admin/AdminFinance.jsx';
import AuditLog from './pages/admin/AuditLog.jsx';
import MyOrders from './pages/student/MyOrders.jsx';
import Notifications from './pages/student/Notifications.jsx';
import Wishlist from './pages/student/Wishlist.jsx';
import PrayerTimes from './pages/student/PrayerTimes.jsx';
import LiveClasses from './pages/student/LiveClasses.jsx';
import ParentLinks from './pages/student/ParentLinks.jsx';
import QuizHistory from './pages/student/QuizHistory.jsx';
import ParentView from './pages/public/ParentView.jsx';
import TeacherLiveClasses from './pages/teacher/LiveClasses.jsx';
import QuranReader from './pages/student/QuranReader.jsx';
import Coupons from './pages/shared/Coupons.jsx';
import PriceHistory from './pages/admin/PriceHistory.jsx';
import Plans from './pages/shared/Plans.jsx';
import Earnings from './pages/teacher/Earnings.jsx';
import EmailLog from './pages/shared/EmailLog.jsx';
import GraceReport from './pages/admin/GraceReport.jsx';
import Overview from './pages/admin/Overview.jsx';
import AccessRequests from './pages/admin/AccessRequests.jsx';
import Refunds from './pages/admin/Refunds.jsx';
import TeacherApprovals from './pages/admin/TeacherApprovals.jsx';
import BulkEmail from './pages/admin/BulkEmail.jsx';
import CouponReport from './pages/admin/CouponReport.jsx';
import MonthlyReport from './pages/admin/MonthlyReport.jsx';
import ProfilePhoto from './pages/shared/ProfilePhoto.jsx';
import StudentContacts from './pages/admin/StudentContacts.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="status" element={<Status />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="parent/:token" element={<ParentView />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify" element={<VerifyCertificate />} />
        <Route path="verify/:code" element={<VerifyCertificate />} />
        {import.meta.env.DEV && <Route path="design" element={<Design />} />}

        {/* Only for logged-out users */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* /student/* */}
      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route path="student" element={<StudentLayout />}>
          <Route index element={<StudentHome />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="courses/:courseId/lessons/:lessonId" element={<LessonReader />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="notes" element={<Notes />} />
          <Route path="certificates" element={<Certificates />} />
<Route path="report" element={<MyReport />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="prayer" element={<PrayerTimes />} />
          <Route path="quran" element={<QuranReader />} />
          <Route path="live" element={<LiveClasses />} />
          <Route path="parent" element={<ParentLinks />} />
          <Route path="quiz-results" element={<QuizHistory />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      {/* /teacher/* */}
      <Route element={<ProtectedRoute roles={['teacher']} />}>
        <Route path="teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherHome />} />
          <Route element={<ApprovedTeacherRoute />}>
            <Route path="courses" element={<MyCourses />} />
            <Route path="courses/new" element={<CourseForm />} />
            <Route path="courses/:id" element={<CourseManage />} />
            <Route path="courses/:id/edit" element={<CourseForm />} />
            <Route path="courses/:courseId/lessons/new" element={<LessonEditor />} />
            <Route path="courses/:courseId/lessons/:lessonId" element={<LessonEditor />} />
            <Route path="courses/:courseId/lessons/:lessonId/quiz" element={<QuizEditor />} />
            <Route path="courses/:courseId/lessons/:lessonId/discussion" element={<LessonDiscussion />} />
            <Route path="students" element={<StudentProgressPage base="/teacher" detailBase="/teacher/students" />} />
            <Route path="students/:studentId" element={<StudentDetailPage base="/teacher" backTo="/teacher/students" />} />
            <Route path="cash" element={<CashOrders />} />
            <Route path="coupons" element={<Coupons coursesPath="/teacher/courses" isTeacher />} />
            <Route path="plans" element={<Plans title="Student installments" canRemind remindBase="/teacher/plans" />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="live" element={<TeacherLiveClasses />} />
            <Route path="profile" element={<ProfilePhoto />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>

      {/* /admin/*  (admin and super admin) */}
      <Route element={<ProtectedRoute roles={['admin', 'super_admin']} />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="students" element={<StudentProgressPage base="/admin" detailBase="/admin/students" />} />
          <Route path="students/:studentId" element={<StudentDetailPage base="/admin" backTo="/admin/students" />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="finance" element={<AdminFinance />} />
          <Route path="coupons" element={<Coupons coursesPath="/admin/courses" />} />
          <Route path="prices" element={<PriceHistory />} />
          <Route path="plans" element={<Plans title="Installments owed" canManage />} />
          <Route path="email-log" element={<EmailLog />} />
          <Route path="grace-report" element={<GraceReport />} />
          <Route path="overview" element={<Overview />} />
          <Route path="access-requests" element={<AccessRequests />} />
          <Route path="refunds" element={<Refunds />} />
          <Route path="teacher-approvals" element={<TeacherApprovals />} />
          <Route path="bulk-email" element={<BulkEmail />} />
          <Route path="coupon-report" element={<CouponReport />} />
          <Route path="monthly-report" element={<MonthlyReport />} />
          <Route path="student-contacts" element={<StudentContacts />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<ProfilePhoto />} />

          {/* Super admin only */}
          <Route element={<ProtectedRoute roles={['super_admin']} />}>
            <Route path="admins" element={<AdminAdmins />} />
            <Route path="audit" element={<AuditLog />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
