import { useState } from 'react';
import postsApi from '../api/posts';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  HStack,
  VStack,
  Text,
  Image,
  Button,
  Icon,
  Avatar,
  Link,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRetweet, FaComment, FaShare } from 'react-icons/fa';

interface PostProps {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  media?: {
    type: 'image' | 'video' | 'link';
    url: string;
    preview?: string;
  }[];
  likes: number;
  reposts: number;
  comments: number;
  timestamp: string;
}

const Post = ({
  id,
  author,
  content,
  media,
  likes,
  reposts,
  comments,
  timestamp,
}: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [repostCount, setRepostCount] = useState(reposts);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to like posts',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await postsApi.likePost(id, user.id, isLiked);
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like post',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRepost = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to repost',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await postsApi.repostPost(id, user.id, isReposted);
      setIsReposted(!isReposted);
      setRepostCount(isReposted ? repostCount - 1 : repostCount + 1);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to repost',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleComment = () => {
    // TODO: Implement comment functionality
    console.log('Comment clicked');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share clicked');
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      bg="white"
      _hover={{ shadow: 'md', cursor: 'pointer' }}
      onClick={() => navigate(`/post/${id}`)}
    >
      <VStack align="stretch" spacing={4}>
        {/* Author Info */}
        <HStack spacing={3}>
          <Avatar size="md" src={author.avatar} name={author.name} />
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold">{author.name}</Text>
            <Text color="gray.500">@{author.username}</Text>
          </VStack>
          <Text color="gray.500" fontSize="sm" ml="auto">
            {timestamp}
          </Text>
        </HStack>

        {/* Post Content */}
        <Text>{content}</Text>

        {/* Media Content */}
        {media && media.length > 0 && (
          <Box borderRadius="md" overflow="hidden">
            {media.map((item, index) => (
              <Box key={index}>
                {item.type === 'image' && (
                  <Image src={item.url} alt="Post media" />
                )}
                {item.type === 'video' && (
                  <video
                    controls
                    style={{ width: '100%', maxHeight: '400px' }}
                  >
                    <source src={item.url} />
                  </video>
                )}
                {item.type === 'link' && (
                  <Link href={item.url} isExternal>
                    <Box
                      p={2}
                      bg="gray.50"
                      borderRadius="md"
                      _hover={{ bg: 'gray.100' }}
                    >
                      {item.preview && (
                        <Image
                          src={item.preview}
                          alt="Link preview"
                          maxH="200px"
                          objectFit="cover"
                        />
                      )}
                      <Text color="blue.500">{item.url}</Text>
                    </Box>
                  </Link>
                )}
              </Box>
            ))}
          </Box>
        )}

        {/* Interaction Buttons */}
        <HStack spacing={8} pt={2}>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FaHeart} color={isLiked ? 'red.500' : 'gray.500'} />}
            onClick={handleLike}
          >
            {likeCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FaRetweet} color={isReposted ? 'green.500' : 'gray.500'} />}
            onClick={handleRepost}
          >
            {repostCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FaComment} color="gray.500" />}
            onClick={handleComment}
          >
            {comments}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FaShare} color="gray.500" />}
            onClick={handleShare}
          />
        </HStack>
      </VStack>
    </Box>
  );
};

export default Post;