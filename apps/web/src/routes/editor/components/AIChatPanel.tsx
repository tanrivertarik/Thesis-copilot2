import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Flex,
  Badge,
  Spinner,
  Button,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon } from '@chakra-ui/icons';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'thinking' | 'writing' | 'complete';
};

type AIChatPanelProps = {
  messages: ChatMessage[];
  onSendCommand: (command: string) => void;
  isProcessing?: boolean;
  hasPendingEdit?: boolean;
  onApplyChanges?: () => void;
  onRejectChanges?: () => void;
};

const SUGGESTED_COMMANDS = [
  { text: "Write an introduction paragraph", icon: "✍️" },
  { text: "Make this section shorter", icon: "✂️" },
  { text: "Add more academic citations", icon: "📚" },
  { text: "Improve the writing style", icon: "✨" },
  { text: "Expand on this idea with 2 more paragraphs", icon: "📝" },
  { text: "Rewrite this to be more formal", icon: "🎓" }
];

export function AIChatPanel({
  messages,
  onSendCommand,
  isProcessing = false,
  hasPendingEdit = false,
  onApplyChanges,
  onRejectChanges
}: AIChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (command?: string) => {
    const textToSend = command || inputValue.trim();
    if (textToSend && !isProcessing) {
      onSendCommand(textToSend);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Flex
      direction="column"
      h="100%"
      bg="gray.50"
      borderRight="1px solid"
      borderColor="gray.200"
    >
      {/* Header */}
      <Box
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="white"
      >
        <HStack justify="space-between">
          <Text fontWeight="semibold" fontSize="md">
            AI Assistant
          </Text>
          {isProcessing && (
            <HStack spacing={2}>
              <Spinner size="xs" color="blue.500" />
              <Text fontSize="xs" color="gray.600">
                Processing...
              </Text>
            </HStack>
          )}
        </HStack>
      </Box>

      {/* Messages */}
      <VStack
        flex="1"
        overflowY="auto"
        spacing={3}
        p={4}
        align="stretch"
      >
        {messages.length === 0 ? (
          <VStack spacing={4} py={6} px={2}>
            <Box textAlign="center" color="gray.600">
              <Text fontSize="sm" fontWeight="semibold" mb={1}>
                Try these commands:
              </Text>
              <Text fontSize="xs" color="gray.500">
                Click a suggestion or type your own
              </Text>
            </Box>
            <Wrap spacing={2} justify="center">
              {SUGGESTED_COMMANDS.map((suggestion) => (
                <WrapItem key={suggestion.text}>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => handleSend(suggestion.text)}
                    isDisabled={isProcessing}
                    leftIcon={<Text>{suggestion.icon}</Text>}
                    _hover={{ bg: 'blue.50', transform: 'scale(1.02)' }}
                    transition="all 0.2s"
                    fontSize="xs"
                  >
                    {suggestion.text}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          </VStack>
        ) : (
          messages.map((message) => (
            <Box
              key={message.id}
              alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
              maxW="85%"
            >
              <Box
                bg={message.role === 'user' ? 'blue.500' : 'white'}
                color={message.role === 'user' ? 'white' : 'gray.800'}
                px={3}
                py={2}
                borderRadius="lg"
                boxShadow="sm"
              >
                {message.role === 'assistant' && message.status && (
                  <Badge
                    colorScheme={
                      message.status === 'thinking'
                        ? 'purple'
                        : message.status === 'writing'
                        ? 'blue'
                        : 'green'
                    }
                    mb={1}
                    fontSize="xs"
                  >
                    {message.status === 'thinking' && '🤔 Thinking...'}
                    {message.status === 'writing' && '✍️ Writing...'}
                    {message.status === 'complete' && '✅ Complete'}
                  </Badge>
                )}
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {message.content}
                </Text>
                <Text
                  fontSize="xs"
                  color={message.role === 'user' ? 'whiteAlpha.700' : 'gray.500'}
                  mt={1}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Text>
              </Box>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </VStack>

      {/* Apply/Reject Action Buttons */}
      {hasPendingEdit && (
        <Box
          p={3}
          borderTop="1px solid"
          borderColor="gray.200"
          bg="blue.50"
        >
          <HStack spacing={2}>
            <Button
              colorScheme="green"
              size="sm"
              flex="1"
              onClick={onApplyChanges}
              leftIcon={<Text>✅</Text>}
            >
              Apply Changes
            </Button>
            <Button
              colorScheme="red"
              size="sm"
              flex="1"
              variant="outline"
              onClick={onRejectChanges}
              leftIcon={<Text>❌</Text>}
            >
              Reject
            </Button>
          </HStack>
          <Text fontSize="xs" color="gray.600" mt={2} textAlign="center">
            Review the highlighted changes in the editor
          </Text>
        </Box>
      )}

      {/* Input */}
      <Box
        p={3}
        borderTop="1px solid"
        borderColor="gray.200"
        bg="white"
      >
        <HStack spacing={2}>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a command... (e.g., 'Make it shorter')"
            size="sm"
            disabled={isProcessing}
            bg="gray.50"
            _focus={{
              bg: 'white',
              borderColor: 'blue.400'
            }}
          />
          <IconButton
            aria-label="Send command"
            icon={<ArrowUpIcon />}
            colorScheme="blue"
            size="sm"
            onClick={handleSend}
            isDisabled={!inputValue.trim() || isProcessing}
            isLoading={isProcessing}
          />
        </HStack>
        <Text fontSize="xs" color="gray.500" mt={2}>
          Commands: "Generate introduction", "Make it shorter", "Add more citations"
        </Text>
      </Box>
    </Flex>
  );
}
