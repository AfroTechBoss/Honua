import { useState, useEffect } from 'react';
import socialApi from '../api/social';
import { useAuth } from '../contexts/AuthContext';
import { getRelativeTime } from '../utils/timeUtils';
import {
  Box,
  HStack,
  VStack,
  Text,
  Image,
  Icon,
  Avatar,
  Link,
  useToast,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Button,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import ImageModal from './ImageModal';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaRetweet, FaComment, FaShare, FaEllipsisV, FaEdit, FaTrash } from 'react-icons/fa';
import { extractLinkPreviews, LinkPreview } from '../utils/linkPreview';

interface PostProps {
  id: string;
  author: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
  content: string;
  media_urls?: string[];
  linkPreviews?: LinkPreview[];
  likes_count: number;
  reposts_count: number;
  comments_count: number;
  timestamp: string;
  onView?: () => void;
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
  onView,
}: PostProps) => {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (onView) {
      onView();
    }
  }, [onView]);
  const [isReposted, setIsReposted] = useState(false);
  const [likesCount, setLikesCount] = useState(likes_count);
  const [repostsCount, setRepostsCount] = useState(reposts_count);
  const [linkPreviews, setLinkPreviews] = useState<LinkPreview[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLinkPreviews = async () => {
      try {
        const previews = await extractLinkPreviews(content);
        setLinkPreviews(previews);
      } catch (error) {
        console.error('Error extracting link previews:', error);
      }
    };

    const fetchInteractionStatus = async () => {
      if (!user || !id || typeof id !== 'string') {
        return;
      }
      try {
        const { isLiked: likedStatus, isReposted: repostedStatus } =
          await socialApi.getInteractionStatus(id, user.id);
        setIsLiked(likedStatus);
        setIsReposted(repostedStatus);
      } catch (error) {
        console.error('Error fetching interaction status:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to fetch interaction status',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchLinkPreviews();
    fetchInteractionStatus();
  }, [content, id, user]);
  const handleLike = async () => {
    if (!id) {
      toast({
        title: 'Error',
        description: 'Post ID is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!id?.trim()) {
      toast({
        title: 'Error',
        description: 'Post ID is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

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
      const { success, isLiked: newLikeState } = await socialApi.toggleLike(id, user.id);
      if (success) {
        setIsLiked(newLikeState);
        setLikesCount(newLikeState ? likesCount + 1 : likesCount - 1);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to like post',
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

    if (!id || typeof id !== 'string' || id.trim() === '') {
      toast({
        title: 'Error',
        description: 'Post ID is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!id?.trim()) {
      toast({
        title: 'Error',
        description: 'Post ID is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const { success, isReposted: newRepostState } = await socialApi.toggleRepost(id, user.id);
      if (success) {
        setIsReposted(newRepostState);
        setRepostsCount(newRepostState ? repostsCount + 1 : repostsCount - 1);
      }
    } catch (error) {
      console.error('Error reposting:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to repost',
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
      const { url } = await socialApi.sharePost(id);
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link Copied',
        description: 'Post link copied to clipboard',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate post ID
    if (!id || typeof id !== 'string' || !id.trim()) {
      toast({
        title: 'Error',
        description: 'Invalid post ID',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate author information
    if (!author?.username || typeof author.username !== 'string' || !author.username.trim()) {
      toast({
        title: 'Error',
        description: 'Invalid author information',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Navigate to the post detail page
    navigate(`/${author.username}/post/${id}`, { state: { from: 'feed' } });
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      bg="white"
      _hover={{ shadow: 'md', cursor: 'pointer' }}
      onClick={handleClick}
    >
      <VStack align="stretch" spacing={4}>
        {/* Author Info */}
        <HStack spacing={3}>
          <Avatar 
            size="md" 
            src={author.avatar_url} 
            name={author.full_name} 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${author.username}`);
            }}
            cursor="pointer"
          />
          <VStack 
            align="start" 
            spacing={0} 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${author.username}`);
            }}
            cursor="pointer"
          >
            <Text fontWeight="bold">{author.full_name}</Text>
            <Text color="gray.500">@{author.username}</Text>
          </VStack>
          <Text color="gray.500" fontSize="sm" ml="auto">
            {getRelativeTime(timestamp)}
          </Text>
          {user?.id === author.id && (
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="Post options"
                icon={<Icon as={FaEllipsisV} />}
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList onClick={(e) => e.stopPropagation()}>
                <MenuItem
                  icon={<Icon as={FaEdit} />}
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(content);
                  }}
                >
                  Edit Post
                </MenuItem>
                <MenuItem
                  icon={<Icon as={FaTrash} />}
                  onClick={async () => {
                    try {
                      // Validate post ID and user authentication
                      if (!id) {
                        throw new Error('Post ID is required');
                      }

                      const postId = String(id).trim();
                      if (!postId) {
                        throw new Error('Post ID cannot be empty');
                      }

                      if (!user?.id) {
                        throw new Error('User authentication required');
                      }

                      // Attempt to delete the post
                      await socialApi.deletePost(postId, user.id);
                      
                      toast({
                        title: "Success",
                        description: "Post deleted successfully",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                      });
                      
                      navigate("/");
                    } catch (error) {
                      console.error('Error deleting post:', error);
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to delete post",
                        status: "error",
                        duration: 3000,
                        isClosable: true,
                      });
                    }
                  }}
                >
                  Delete Post
                </MenuItem>
              </MenuList>
            </Menu>
          )}
        </HStack>

        {/* Post Content */}
        {isEditing ? (
          <Box onClick={(e) => e.stopPropagation()}>
            <textarea
              id="edit-post-content"
              name="post-content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                width: "100%",
                minHeight: "100px",
                padding: "8px",
                marginBottom: "8px",
                borderRadius: "4px",
                border: "1px solid #E2E8F0",
              }}
            />
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={async () => {
                  try {
                    if (!id || typeof id !== 'string' || !id.trim()) {
                      throw new Error('Invalid post ID');
                    }

                    if (!user) {
                      throw new Error('User authentication required');
                    }

                    await socialApi.editPost(id, user.id, editContent);
                    toast({
                      title: "Success",
                      description: "Post updated successfully",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                    setIsEditing(false);
                  } catch (error) {
                    console.error('Error editing post:', error);
                    toast({
                      title: "Error",
                      description: error instanceof Error ? error.message : "Failed to update post",
                      status: "error",
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                }}
              >
                Save
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(content);
                }}
              >
                Cancel
              </Button>
            </HStack>
          </Box>
        ) : (
          <Text>
            {content.split(/(https?:\/\/[^\s]+)/g).map((part, index) => {
              if (part.match(/^https?:\/\//)) {
                return (
                  <Link
                    key={index}
                    href={part}
                    color="blue.500"
                    isExternal
                    onClick={(e) => e.stopPropagation()}
                  >
                    {part}
                  </Link>
                );
              }
              return part;
            })}
          </Text>
        )}

        {/* Media Content */}
        {media_urls && media_urls.length > 0 && (
          <Box borderRadius="md" overflow="hidden">
            <Grid
              templateColumns={media_urls.length === 1 ? '1fr' :
                media_urls.length === 2 ? 'repeat(2, 1fr)' :
                media_urls.length === 3 ? 'repeat(2, 1fr)' :
                'repeat(2, 1fr)'}
              gap={2}
              templateRows={media_urls.length === 3 ? '200px 200px' : '200px'}
              templateAreas={media_urls.length === 3 ?
                `"img1 img2"
                 "img3 img3"` :
                undefined}
            >
              {media_urls.map((url, index) => (
                <GridItem
                  key={`${id}-media-${index}`}
                  area={media_urls.length === 3 ? `img${index + 1}` : undefined}
                >
                  {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <Image
                      src={url}
                      alt="Post media"
                      w="100%"
                      h="100%"
                      objectFit="cover"
                      borderRadius="md"
                      cursor="pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                        setIsImageModalOpen(true);
                      }}
                    />
                  ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                    <Box h="100%" position="relative">
                      <video
                        controls
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '0.375rem'
                        }}
                      >
                        <source src={url} />
                      </video>
                    </Box>
                  ) : null}
                </GridItem>
              ))}
            </Grid>
          </Box>
        )}

        {/* Link Previews */}
        {linkPreviews && linkPreviews.length > 0 && (
          <VStack spacing={2} align="stretch">
            {linkPreviews.map((preview: LinkPreview, index: number) => (
              <Link 
                key={`${id}-preview-${index}`} 
                href={preview.url} 
                isExternal 
                _hover={{ textDecoration: 'none' }}
                onClick={(e) => e.stopPropagation()}
              >
                <Box 
                  borderWidth="1px" 
                  borderRadius="md" 
                  overflow="hidden"
                  _hover={{ bg: 'gray.50' }}
                >
                  <HStack spacing={4} p={3} align="start">
                    {preview.image && (
                      <Image 
                        src={preview.image} 
                        alt={preview.title}
                        boxSize="100px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                    )}
                    <VStack align="start" flex={1} spacing={1}>
                      <Text fontWeight="bold" noOfLines={2}>
                        {preview.title}
                      </Text>
                      {preview.description && (
                        <Text fontSize="sm" color="gray.600" noOfLines={2}>
                          {preview.description}
                        </Text>
                      )}
                      <Text fontSize="xs" color="gray.500">
                        {preview.siteName || new URL(preview.url).hostname}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </Link>
            ))}
          </VStack>
        )}

        {/* Interaction Buttons */}
        <HStack spacing={4} mt={4}>
            <Tooltip label={isLiked ? 'Unlike' : 'Like'} placement="top">
              <IconButton
                aria-label={isLiked ? 'Unlike' : 'Like'}
                icon={<Icon as={FaHeart} color={isLiked ? 'red.500' : 'gray.500'} />}
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
              />
            </Tooltip>
            <Text color="gray.500" fontSize="sm">{likesCount}</Text>

            <Tooltip label={isReposted ? 'Undo Repost' : 'Repost'} placement="top">
              <IconButton
                aria-label={isReposted ? 'Undo Repost' : 'Repost'}
                icon={<Icon as={FaRetweet} color={isReposted ? 'green.500' : 'gray.500'} />}
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRepost();
                }}
              />
            </Tooltip>
            <Text color="gray.500" fontSize="sm">{repostsCount}</Text>

            <Tooltip label="Comment" placement="top">
              <IconButton
                aria-label="Comment"
                icon={<Icon as={FaComment} color="gray.500" />}
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComment();
                }}
              />
            </Tooltip>
            <Text color="gray.500" fontSize="sm">{comments_count}</Text>

            <Menu>
              <Tooltip label="Share" placement="top">
                <MenuButton
                  as={IconButton}
                  aria-label="Share options"
                  icon={<Icon as={FaShare} color="gray.500" />}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
              <MenuList onClick={(e) => e.stopPropagation()}>
                <MenuItem onClick={handleShare}>Copy Link</MenuItem>
                <MenuItem
                  onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + `/post/${id}`)}&text=${encodeURIComponent(content)}`, '_blank')}
                >
                  Share on Twitter
                </MenuItem>
                <MenuItem
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + `/post/${id}`)}`, '_blank')}
                >
                  Share on Facebook
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
      </VStack>
      {media_urls && media_urls.length > 0 && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          images={media_urls.filter(url => url.match(/\.(jpg|jpeg|png|gif)$/i))}
          currentIndex={currentImageIndex}
          onIndexChange={setCurrentImageIndex}
        />
      )}
    </Box>
  );
};

export default Post;