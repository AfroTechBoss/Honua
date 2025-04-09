import { useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Text,
  Button,
  useDisclosure,
  Icon,
  Select,
  HStack,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaSearch, FaPlus, FaFilter } from 'react-icons/fa';
import Navigation from '../components/Navigation';
import TrendingTopics from '../components/TrendingTopics';
import PostComponent from '../components/Post';
import CreatePostModal from '../components/CreatePostModal';
import { useAuth } from '../contexts/AuthContext';
import postsApi from '../api/posts';
import { Post } from '../types/post';

import { useState } from 'react';

const MainFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<string>('latest');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const toast = useToast();

  const handleCreatePost = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create a post',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    onOpen();
  };

  const handlePostCreated = (newPost: any) => {
    const transformedPost = {
      id: newPost.id,
      content: newPost.content,
      user_id: newPost.user_id,
      author: newPost.author ? {
        username: newPost.author.username,
        full_name: newPost.author.full_name,
        avatar_url: newPost.author.avatar_url || `https://api.dicebear.com/6.x/avatars/svg?seed=${newPost.author.username}`
      } : {
        username: 'anonymous',
        full_name: 'Anonymous User',
        avatar_url: `https://api.dicebear.com/6.x/avatars/svg?seed=anonymous`
      },
      likes_count: 0,
      reposts_count: 0,
      comments_count: 0,
      media_urls: newPost.media_urls || [],
      created_at: newPost.created_at,
      updated_at: newPost.updated_at,
      timestamp: new Date(newPost.created_at).toLocaleString()
    };
    setPosts([transformedPost, ...posts])
  };

  const [isLoading, setIsLoading] = useState<boolean>(false); // Add this line to declare the isLoading state
  const loadPosts = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const page = Math.floor(posts.length / 10);
      const response = await postsApi.getPosts(page);
      const newPosts = response.posts;
      const moreAvailable = response.hasMore;
        
      // Transform the posts data to match the PostComponent props
      const transformedPosts = newPosts.map(post => {
        const defaultAuthor = {
          username: 'anonymous',
          full_name: 'Anonymous User',
          avatar_url: `https://api.dicebear.com/6.x/avatars/svg?seed=anonymous`
        };
        
        return {
          id: post.id,
          content: post.content,
          user_id: post.user_id,
          author: post.author ? {
            username: post.author.username,
            full_name: post.author.full_name,
            avatar_url: post.author.avatar_url || `https://api.dicebear.com/6.x/avatars/svg?seed=${post.author.username}`
          } : defaultAuthor,
          likes_count: post.likes_count || 0,
          reposts_count: post.reposts_count || 0,
          comments_count: post.comments_count || 0,
          media_urls: post.media_urls || [],
          created_at: post.created_at,
          updated_at: post.updated_at,
          timestamp: new Date(post.created_at).toLocaleString()
        }
      });

      setPosts(prev => [...prev, ...transformedPosts]);
      setHasMore(moreAvailable);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: 'Error loading posts',
        description: 'Failed to load posts',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, posts.length, toast]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!observerRef.current) {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    loadPosts();
                }
            },
            { threshold: 0.5 }
        );
        observerRef.current = observer;

        if (lastPostRef.current) {
            observer.observe(lastPostRef.current);
        }
    }

    return () => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
    };
}, [loadPosts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
    console.log('Searching for:', query);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value);
    // TODO: Implement filter functionality
    console.log('Filter changed to:', event.target.value);
  };

  return (
    <Container maxW="container.xl" py={4}>
      <Grid
        templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }}
        gap={6}
      >
        {/* Navigation Menu */}
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <Navigation />
          </Box>
        </GridItem>

        {/* Main Feed */}
        <GridItem>
          <VStack spacing={4} align="stretch" height="calc(100vh - 2rem)" overflow="hidden">
            {/* Search and Filter */}
            <HStack spacing={4}>
              <InputGroup flex={1}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="gray.500" />
                </InputLeftElement>
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </InputGroup>
              <Select
                w="150px"
                value={filter}
                onChange={handleFilterChange}
                icon={<FaFilter />}
              >
                <option value="latest">Latest</option>
                <option value="trending">Trending</option>
                <option value="top">Top</option>
              </Select>
            </HStack>

            {/* Floating Action Button */}
            <Box
              as={motion.div}
              position="fixed"
              bottom="4rem"
              right="4rem"
              zIndex={1000}
            >
              <Button
                as={motion.button}
                colorScheme="blue"
                borderRadius="full"
                height="56px"
                display="flex"
                alignItems="center"
                px={4}
                onClick={handleCreatePost}
                whileHover={{ scale: 1.05, width: '180px' }}
                initial={{ width: '56px', scale: 1 }}
                transition="all 0.2s"
                boxShadow="lg"
              >
                <Icon as={FaPlus} boxSize={5} />
                <Text
                  as={motion.span}
                  ml={2}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition="all 0.2s"
                  whiteSpace="nowrap"
                  overflow="hidden"
                >
                  Create Post
                </Text>
              </Button>
            </Box>

            {/* Post Feed */}
            <VStack spacing={4} align="stretch" flex="1" overflow="auto" css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(0, 0, 0, 0.3)',
              },
            }}>
              {posts.map((post, index) => (
                <Box
                  key={post.id}
                  ref={index === posts.length - 1 ? lastPostRef : null}
                >
                  <PostComponent {...post} />
                </Box>
              ))}
              {isLoading && (
                <Box textAlign="center" py={4}>
                  <Spinner size="lg" />
                </Box>
              )}
              {!isLoading && !hasMore && (
                <Text textAlign="center" color="gray.500">
                  No more posts to load
                </Text>
              )}
            </VStack>
          </VStack>
        </GridItem>

        {/* Trending Topics */}
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <TrendingTopics />
          </Box>
        </GridItem>
      </Grid>

      {/* Create Post Modal */}
      <CreatePostModal isOpen={isOpen} onClose={onClose} onPostCreated={handlePostCreated} />
    </Container>
  );
};

export default MainFeed;