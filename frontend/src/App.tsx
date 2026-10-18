import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import Admin from '@/pages/Admin';
import Announcements from '@/pages/Announcements';
import Calendar from '@/pages/Calendar';
import Dashboard from '@/pages/Dashboard';
import Events from '@/pages/Events';
import NotFound from '@/pages/NotFound';
import PerformanceTasks from '@/pages/PerformanceTasks';
import Reviewers from '@/pages/Reviewers';
import Tasks from '@/pages/Tasks';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="performance-tasks" element={<PerformanceTasks />} />
        <Route path="reviewers" element={<Reviewers />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="events" element={<Events />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
