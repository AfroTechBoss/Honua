import { useEffect, useState } from 'react';
import {
  VStack,
  Button,
  Icon,
  Text,
  HStack,
  Avatar,
  Box,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import {
  FaHome,
  FaCompass,
  FaBell,
  FaEnvelope,
  FaBookmark,
  FaUser,
  FaCog,
  FaUsers,
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { userService, UserProfile } from '../api/user.api';

interface NavItemProps {
  icon: any;
  label: string;
  to: string;
  notifications?: number;
}

const NavItem = ({ icon, label, to, notifications }: NavItemProps) => {
  const bgHover = useColorModeValue('gray.100', 'gray.700');

  return (
    <Button
      as={RouterLink}
      to={to}
      variant="ghost"
      justifyContent="flex-start"
      width="full"
      py={6}
      _hover={{ bg: bgHover }}
      position="relative"
    >
      <HStack spacing={4}>
        <Icon as={icon} boxSize={5} />
        <Text fontSize="lg">{label}</Text>
      </HStack>
      {notifications && notifications > 0 && (
        <Box
          position="absolute"
          right={2}
          bg="red.500"
          color="white"
          borderRadius="full"
          px={2}
          py={1}
          fontSize="xs"
        >
          {notifications}
        </Box>
      )}
    </Button>
  );
};

const Navigation = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const userProfile = await userService.getCurrentUser();
          setProfile(userProfile);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  // Temporary notifications (TODO: Implement real notification system)
  const notifications = {
    alerts: 3,
    messages: 2
  };

  return (
    <VStack spacing={2} align="stretch" width="full">
      <Button
        as={RouterLink}
        to={profile?.username ? `/${profile.username}` : '/profile'}
        variant="ghost"
        justifyContent="flex-start"
        py={6}
      >
        {loading ? (
          <Spinner size="sm" />
        ) : (
          <HStack spacing={4}>
            <Avatar 
              size="sm" 
              src={profile?.avatar_url} 
              name={profile?.full_name || profile?.username} 
            />
            <Text fontSize="lg" fontWeight="bold">
              {profile?.full_name || profile?.username || 'Profile'}
            </Text>
          </HStack>
        )}
      </Button>

      <NavItem icon={FaHome} label="Home" to="/" />
      <NavItem icon={FaCompass} label="Explore" to="/explore" />
      <NavItem icon={FaUsers} label="Communities" to="/communities" />
      <NavItem
        icon={FaBell}
        label="Notifications"
        to="/notifications"
        notifications={notifications.alerts}
      />
      <NavItem
        icon={FaEnvelope}
        label="Messages"
        to="/messages"
        notifications={notifications.messages}
      />
      <NavItem icon={FaBookmark} label="Bookmarks" to="/bookmarks" />
      <NavItem icon={FaUser} label="Profile" to={profile?.username ? `/${profile.username}` : '/profile'} />
      <NavItem icon={FaCog} label="Settings" to="/settings" />
    </VStack>
  );
};

export default Navigation;