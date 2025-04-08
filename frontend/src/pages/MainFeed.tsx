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
import postsApi, { Post } from '../api/posts';

import { useState } from 'react';

const MainFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  const loadPosts = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const page = Math.floor(posts.length / 4);
      const { posts: newPosts, hasMore: moreAvailable } = await postsApi.getPosts(page);

      setPosts(prev => [...prev, ...newPosts]);
      setHasMore(moreAvailable);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: 'Error loading posts',
        description: 'Please try again later',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  }, [posts.length, isLoading, hasMore, toast]);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
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

    return () => observer.disconnect();
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
          <VStack spacing={4} align="stretch">
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
            <VStack spacing={4} align="stretch">
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
      <CreatePostModal isOpen={isOpen} onClose={onClose} />
    </Container>
  );
};

export default MainFeed;