import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Flex,
  Badge,
  Spinner
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
};

export function AIChatPanel({ messages, onSendCommand, isProcessing = false }: AIChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !isProcessing) {
      onSendCommand(inputValue.trim());
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
          <Box textAlign="center" py={8} color="gray.500">
            <Text fontSize="sm">
              No messages yet. Start by asking the AI to write or edit your draft.
            </Text>
          </Box>
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
