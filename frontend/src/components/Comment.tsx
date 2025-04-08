import { useState } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from '@chakra-ui/react';
import { FaHeart, FaReply, FaEllipsisH } from 'react-icons/fa';
import CommentComposer from './CommentComposer';

interface CommentProps {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  replies: CommentProps[];
  depth?: number;
  onReply: (commentId: string, content: string) => void;
  onLike: (commentId: string) => void;
}

const Comment = ({
  id,
  author,
  content,
  timestamp,
  likes,
  replies,
  depth = 0,
  onReply,
  onLike,
}: CommentProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const toast = useToast();

  const handleLike = async () => {
    try {
      await onLike(id);
      setIsLiked(!isLiked);
      setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like comment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReplySubmit = (content: string) => {
    onReply(id, content);
    setIsReplying(false);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: 'Comment text copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box pl={depth * 4}>
      <Box p={4} bg={depth % 2 === 0 ? 'gray.50' : 'white'} borderRadius="md">
        <VStack align="stretch" spacing={3}>
          <HStack spacing={3} align="start">
            <Avatar size="sm" src={author.avatar} name={author.name} />
            <Box flex={1}>
              <HStack justify="space-between" mb={1}>
                <HStack>
                  <Text fontWeight="bold">{author.name}</Text>
                  <Text color="gray.500">@{author.username}</Text>
                </HStack>
                <Text color="gray.500" fontSize="sm">
                  {timestamp}
                </Text>
              </HStack>
              <Text mb={2}>{content}</Text>
              <HStack spacing={4}>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FaHeart color={isLiked ? 'red.500' : 'gray.500'} />}
                  onClick={handleLike}
                >
                  {likeCount}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  leftIcon={<FaReply />}
                  onClick={() => setIsReplying(true)}
                >
                  Reply
                </Button>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FaEllipsisH />}
                    variant="ghost"
                    size="sm"
                    aria-label="More options"
                  />
                  <MenuList>
                    <MenuItem onClick={handleCopyText}>Copy Text</MenuItem>
                    <MenuItem onClick={() => {
                      toast({
                        title: 'Reported',
                        description: 'Comment has been reported',
                        status: 'info',
                        duration: 2000,
                        isClosable: true,
                      });
                    }}>Report</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Box>
          </HStack>

          {isReplying && (
            <Box pl={8}>
              <CommentComposer
                onSubmit={handleReplySubmit}
                replyingTo={author.username}
                placeholder={`Reply to @${author.username}...`}
              />
            </Box>
          )}
        </VStack>
      </Box>

      {replies.map((reply) => (
        <Comment
          key={reply.id}
          {...reply}
          depth={depth + 1}
          onReply={onReply}
          onLike={onLike}
        />
      ))}
    </Box>
  );
};

export default Comment;