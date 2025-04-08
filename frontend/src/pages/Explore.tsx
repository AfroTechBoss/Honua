import { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Tag,
  TagLabel,
  Avatar,
  Button,
  Select,
  useColorModeValue,
  Heading,
} from '@chakra-ui/react';
import { FaSearch, FaFire, FaHashtag } from 'react-icons/fa';
import Navigation from '../components/Navigation';
import Post from '../components/Post';

interface TrendingTopic {
  id: string;
  name: string;
  postCount: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
}

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('latest');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Mock data - Replace with API calls
  const trendingTopics: TrendingTopic[] = [
    { id: '1', name: 'Technology', postCount: 1234 },
    { id: '2', name: 'Climate', postCount: 890 },
    { id: '3', name: 'Innovation', postCount: 567 },
  ];

  const categories: Category[] = [
    { id: '1', name: 'Technology', icon: '💻' },
    { id: '2', name: 'Science', icon: '🔬' },
    { id: '3', name: 'Art', icon: '🎨' },
    { id: '4', name: 'Music', icon: '🎵' },
  ];

  const suggestedUsers: SuggestedUser[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      username: 'alice_tech',
      avatar: 'https://bit.ly/alice-avatar',
      bio: 'Tech enthusiast | AI researcher',
    },
    {
      id: '2',
      name: 'Bob Smith',
      username: 'bob_creates',
      avatar: 'https://bit.ly/bob-avatar',
      bio: 'Digital artist | Creator',
    },
  ];

  // Mock posts data
  const posts = [
    {
      id: '1',
      author: {
        name: 'Alice Johnson',
        username: 'alice_tech',
        avatar: 'https://bit.ly/alice-avatar',
      },
      content: 'Just launched my new AI project! #Technology #Innovation',
      likes: 42,
      reposts: 12,
      comments: 8,
      timestamp: '2h ago',
    },
    {
      id: '2',
      author: {
        name: 'Bob Smith',
        username: 'bob_creates',
        avatar: 'https://bit.ly/bob-avatar',
      },
      content: 'Check out my latest digital art piece! #Art #Digital',
      media: [{ type: 'image' as const, url: 'https://bit.ly/art-preview' }],
      likes: 128,
      reposts: 24,
      comments: 16,
      timestamp: '4h ago',
    },
  ];

  return (
    <Container maxW="container.xl" py={4}>
      <Grid templateColumns={{ base: '1fr', md: '1fr 3fr 1fr' }} gap={6}>
        {/* Navigation Menu */}
        <GridItem display={{ base: 'none', md: 'block' }}>
          <Box position="sticky" top={4}>
            <Navigation />
          </Box>
        </GridItem>

        {/* Main Content */}
        <GridItem>
          <VStack spacing={4} align="stretch">
            {/* Search and Filters */}
            <Box bg={bgColor} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <VStack spacing={4}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaSearch} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search posts, topics, or users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </InputGroup>
                <HStack spacing={4}>
                  <Select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    width="auto"
                  >
                    <option value="latest">Latest</option>
                    <option value="popular">Popular</option>
                    <option value="media">Media</option>
                  </Select>
                </HStack>
              </VStack>
            </Box>

            {/* Posts */}
            <VStack spacing={4} align="stretch">
              {posts.map((post) => (
                <Post key={post.id} {...post} />
              ))}
            </VStack>
          </VStack>
        </GridItem>

        {/* Sidebar */}
        <GridItem display={{ base: 'none', md: 'block' }}>
          <VStack spacing={6} position="sticky" top={4}>
            {/* Trending Topics */}
            <Box
              bg={bgColor}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              w="full"
            >
              <Heading size="md" mb={4}>
                <HStack>
                  <Icon as={FaFire} color="orange.500" />
                  <Text>Trending Topics</Text>
                </HStack>
              </Heading>
              <VStack align="stretch" spacing={3}>
                {trendingTopics.map((topic) => (
                  <HStack key={topic.id} justify="space-between">
                    <HStack>
                      <Icon as={FaHashtag} color="gray.500" />
                      <Text>{topic.name}</Text>
                    </HStack>
                    <Text color="gray.500" fontSize="sm">
                      {topic.postCount} posts
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>

            {/* Categories */}
            <Box
              bg={bgColor}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              w="full"
            >
              <Heading size="md" mb={4}>Categories</Heading>
              <HStack spacing={2} flexWrap="wrap">
                {categories.map((category) => (
                  <Tag
                    key={category.id}
                    size="lg"
                    borderRadius="full"
                    variant="subtle"
                    colorScheme="blue"
                    cursor="pointer"
                    _hover={{ bg: 'blue.100' }}
                  >
                    <TagLabel>
                      {category.icon} {category.name}
                    </TagLabel>
                  </Tag>
                ))}
              </HStack>
            </Box>

            {/* Suggested Users */}
            <Box
              bg={bgColor}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              w="full"
            >
              <Heading size="md" mb={4}>Suggested Users</Heading>
              <VStack spacing={4} align="stretch">
                {suggestedUsers.map((user) => (
                  <HStack key={user.id} spacing={3}>
                    <Avatar size="sm" src={user.avatar} name={user.name} />
                    <Box flex={1}>
                      <Text fontWeight="bold" fontSize="sm">
                        {user.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        @{user.username}
                      </Text>
                    </Box>
                    <Button size="sm" colorScheme="blue" variant="outline">
                      Follow
                    </Button>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </Container>
  );
};

export default Explore;