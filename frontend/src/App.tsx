import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import MainFeed from './pages/MainFeed';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Explore from './pages/Explore';
import Bookmarks from './pages/Bookmarks';
import Notifications from './pages/Notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProfileEdit from './pages/ProfileEdit';
import AuthCallback from './pages/auth/AuthCallback';

const theme = extendTheme({});

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/feed" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/feed" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/feed" element={!user ? <Navigate to="/login" replace /> : <MainFeed />} />
        <Route path="/profile" element={!user ? <Navigate to="/login" replace /> : <Profile />} />
        <Route path="/messages" element={!user ? <Navigate to="/login" replace /> : <Messages />} />
        <Route path="/settings" element={!user ? <Navigate to="/login" replace /> : <Settings />} />
        <Route path="/explore" element={!user ? <Navigate to="/login" replace /> : <Explore />} />
        <Route path="/bookmarks" element={!user ? <Navigate to="/login" replace /> : <Bookmarks />} />
        <Route path="/notifications" element={!user ? <Navigate to="/login" replace /> : <Notifications />} />
        <Route path="/profile/edit" element={!user ? <Navigate to="/login" replace /> : <ProfileEdit />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/" element={user ? <Navigate to="/feed" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChakraProvider theme={theme}>
        <AppRoutes />
      </ChakraProvider>
    </AuthProvider>
  );
}