import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  Text,
  Button,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  useToast,
  useDisclosure,
  Skeleton,
} from '@chakra-ui/react';
import EditProfileModal from '../components/EditProfileModal';
import { FaEdit } from 'react-icons/fa';
import Navigation from '../components/Navigation';
import TrendingTopics from '../components/TrendingTopics';
import Post from '../components/Post';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../api/user.api';

interface ProfileData {
  id: string;
  full_name: string;
  username: string;
  bio?: string;
  avatar_url: string | null;
  updated_at: string;
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const isOwnProfile = user?.id === (userId || user?.id);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const profileData = await userService.getUserProfile(userId || user?.id || '');
        if (!profileData) {
          setError('Profile not found');
          return;
        }
        setProfile(profileData);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
        toast({
          title: 'Error',
          description: 'Failed to load profile',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, userId, toast]);

  const handleEditProfile = () => {
    onOpen();
  };

  const handleProfileUpdate = async () => {
    try {
      const updatedProfile = await userService.getUserProfile(user?.id || '');
      setProfile(updatedProfile);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={4}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <Box position="sticky" top={4}>
              <Navigation />
            </Box>
          </GridItem>
          <GridItem>
            <VStack spacing={4} align="stretch">
              <Skeleton height="200px" />
              <Skeleton height="100px" />
              <Skeleton height="20px" />
              <Skeleton height="20px" />
            </VStack>
          </GridItem>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <TrendingTopics />
          </GridItem>
        </Grid>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container maxW="container.xl" py={4}>
        <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <Box position="sticky" top={4}>
              <Navigation />
            </Box>
          </GridItem>
          <GridItem>
            <Text>{error || 'Profile not found'}</Text>
          </GridItem>
          <GridItem display={{ base: 'none', md: 'block' }}>
            <TrendingTopics />
          </GridItem>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={4}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <Navigation />
          </Box>
        </GridItem>

        <GridItem>
          <VStack spacing={4} align="stretch">
            <Box textAlign="center" pt={8}>
              <Avatar
                size="2xl"
                src={profile.avatar_url || undefined}
                name={profile.full_name || profile.username}
                mb={4}
              />
              <VStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold">
                  {profile.full_name}
                </Text>
                <Text color="gray.500">@{profile.username}</Text>
                {isOwnProfile && (
                  <Button
                    leftIcon={<Icon as={FaEdit} />}
                    onClick={handleEditProfile}
                    colorScheme="blue"
                    variant="outline"
                  >
                    Edit Profile
                  </Button>
                )}
              </VStack>

              {profile.bio && <Text mt={4}>{profile.bio}</Text>}
            </Box>

            {/* Content Tabs */}
            <Tabs colorScheme="blue" mt={4}>
              <TabList>
                <Tab>Posts</Tab>
                <Tab>Replies</Tab>
                <Tab>Media</Tab>
              </TabList>

              <TabPanels>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* TODO: Replace with actual posts */}
                    <Post
                      id="1"
                      author={{
                        name: profile.full_name,
                        username: profile.username,
                        avatar: profile.avatar_url || ''
                      }}
                      content="This is a sample post about sustainability."
                      likes={42}
                      reposts={12}
                      comments={5}
                      timestamp="2 hours ago"
                    />
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* TODO: Add replies content */}
                    <Text color="gray.500">No replies yet</Text>
                  </VStack>
                </TabPanel>
                <TabPanel px={0}>
                  <VStack spacing={4} align="stretch">
                    {/* TODO: Add media content */}
                    <Text color="gray.500">No media yet</Text>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </GridItem>

        {/* Trending Topics Sidebar */}
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <TrendingTopics />
          </Box>
        </GridItem>
      </Grid>
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isOpen}
        onClose={onClose}
        profile={{
          full_name: profile.full_name,
          username: profile.username,
          bio: profile.bio,
          avatar_url: profile.avatar_url || undefined
        }}
        onUpdate={handleProfileUpdate}
      />
    </Container>
  );
};

export default Profile;