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
    full_name: string;
    username: string;
    avatar_url: string;
  };
  content: string;
  media_urls?: string[];
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  timestamp: string;
}

const Post = ({
  id,
  author,
  content,
  media_urls,
  likes_count,
  reposts_count,
  comments_count,
  timestamp,
}: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [likesCount, setLikesCount] = useState(likes_count);
  const [repostsCount, setRepostsCount] = useState(reposts_count);
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
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
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
      setRepostsCount(isReposted ? repostsCount - 1 : repostsCount + 1);
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
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to comment',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    navigate(`/post/${id}#comments`);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Share Post',
        text: content,
        url: window.location.origin + `/post/${id}`,
      });
    } catch (error) {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.origin + `/post/${id}`)
        .then(() => {
          toast({
            title: 'Link Copied',
            description: 'Post link copied to clipboard',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'Failed to copy link',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
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
          <Avatar size="md" src={author.avatar_url} name={author.full_name} />
          <VStack align="start" spacing={0}>
            <Text fontWeight="bold">{author.full_name}</Text>
            <Text color="gray.500">@{author.username}</Text>
          </VStack>
          <Text color="gray.500" fontSize="sm" ml="auto">
            {timestamp}
          </Text>
        </HStack>

        {/* Post Content */}
        <Text>{content}</Text>

        {/* Media Content */}
        {media_urls && media_urls.length > 0 && (
          <Box borderRadius="md" overflow="hidden">
            {media_urls.map((url, index) => (
              <Box key={`${id}-media-${index}`}>
                {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <Image src={url} alt="Post media" />
                ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    controls
                    style={{ width: '100%', maxHeight: '400px' }}
                  >
                    <source src={url} />
                  </video>
                ) : (
                  <Link href={url} isExternal>
                    <Box
                      p={2}
                      bg="gray.50"
                      borderRadius="md"
                      _hover={{ bg: 'gray.100' }}
                    >
                      <Text color="blue.500">{url}</Text>
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
            {likesCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FaRetweet} color={isReposted ? 'green.500' : 'gray.500'} />}
            onClick={handleRepost}
          >
            {repostsCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Icon as={FaComment} color="gray.500" />}
            onClick={handleComment}
          >
            {comments_count}
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