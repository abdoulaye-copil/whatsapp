import { getAllChats, getChatById, searchChats, markAsRead, createNewChat } from '../models/chatModel.js';
import { getMessagesByChatId, addMessage } from '../models/messageModel.js';
import { renderChatList, updateChatInList } from '../views/chatListView.js';
import { 
  renderChatHeader, 
  renderMessages, 
  addMessageToChat, 
  initMessageInput 
} from '../views/chatView.js';
import { renderNewDiscussionView, hideNewDiscussionView } from '../views/newDiscussionView.js';

let activeChat = null;

function initChat() {
  const chats = getAllChats();
  renderChatList(chats, handleChatClick);

  initSearch();
  initMessageInput(handleSendMessage);
  
  initNewChatButton();
}

function initNewChatButton() {
  const newChatBtn = document.getElementById('new-chat-btn');
  if (!newChatBtn) return;

  newChatBtn.addEventListener('click', async () => {
    try {
      await renderNewDiscussionView(handleNewChat);
    } catch (error) {
      console.error('Error opening new discussion view:', error);
    }
  });
}

async function handleNewChat(contact) {
  try {
    console.log('handleNewChat appelé avec:', contact);
    
    if (!contact || !contact.id) {
      console.error('Contact invalide:', contact);
      return;
    }

    // Créer ou récupérer le chat
    const chat = await createNewChat(contact);
    if (!chat) {
      console.error('Erreur lors de la création du chat');
      return;
    }

    console.log('Chat créé/récupéré:', chat);

    // Masquer la vue des nouvelles discussions
    hideNewDiscussionView();

    // Définir le chat actif AVANT de mettre à jour l'interface
    activeChat = chat;
    window.activeChat = chat;

    // Afficher les éléments de chat
    showChatInterface();

    // Mettre à jour l'interface avec les données du chat
    renderChatHeader(chat);
    
    // Récupérer et afficher les messages
    const messages = getMessagesByChatId(chat.id) || [];
    renderMessages(messages);

    // Mettre à jour la liste des chats
    const allChats = getAllChats();
    renderChatList(allChats, handleChatClick);

    console.log('Chat activé avec succès:', chat.name);

  } catch (error) {
    console.error('Erreur handleNewChat:', error);
  }
}

function showChatInterface() {
  const messagesContainer = document.getElementById('messages-container');
  const welcomeScreen = document.getElementById('welcome-screen');
  const chatHeader = document.getElementById('chat-header');
  const messageInput = document.getElementById('message-input-container');

  if (welcomeScreen) {
    welcomeScreen.classList.add('hidden');
  }
  
  if (messagesContainer) {
    messagesContainer.classList.remove('hidden');
  }
  
  if (chatHeader) {
    chatHeader.classList.remove('hidden');
  }
  
  if (messageInput) {
    messageInput.classList.remove('hidden');
  }
}

function handleChatClick(chat) {
  if (!chat || !chat.id) {
    console.error('Invalid chat object');
    return;
  }

  console.log('Chat cliqué:', chat);

  // Afficher les éléments de chat
  showChatInterface();

  // Gérer les messages non lus
  if (chat.unreadCount > 0) {
    markAsRead(chat.id);
    updateChatInList(getChatById(chat.id));
  }

  // Mettre à jour le chat actif
  activeChat = chat;
  window.activeChat = chat;

  // Mettre à jour l'interface
  renderChatHeader(chat);
  const messages = getMessagesByChatId(chat.id);
  renderMessages(messages || []);
}

function initSearch() {
  const searchInput = document.getElementById('search-input');
  
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim();
      const filteredChats = searchChats(query);
      renderChatList(filteredChats, handleChatClick);
    });
  }
}

async function handleSendMessage(text, isVoice = false, duration = null, audioBlob = null) {
  if (!activeChat || !activeChat.id) {
    console.error('No active chat or invalid chat ID');
    return;
  }
  
  try {
    let message;
    
    if (isVoice && audioBlob) {
      // Créer un message vocal
      message = {
        id: Date.now().toString(),
        chatId: activeChat.id,
        text: text,
        timestamp: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        isMe: true,
        isVoice: true,
        duration: duration,
        audioBlob: audioBlob
      };
      
      // Ajouter le message directement à l'interface
      addMessageToChat(message);
      
      // Mettre à jour le dernier message dans la liste des chats
      const chats = getAllChats();
      renderChatList(chats, handleChatClick);
      
    } else {
      // Message texte normal
      message = await addMessage(activeChat.id, text);
      if (message) {
        addMessageToChat(message);
        const chats = getAllChats();
        renderChatList(chats, handleChatClick);
        
        // Simuler une réponse
        simulateReply(activeChat.id);
      }
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

function simulateReply(chatId) {
  setTimeout(() => {
    if (activeChat && activeChat.id === chatId) {
      const replies = [
        "D'accord, je comprends.",
        "Merci pour l'information.",
        "Intéressant, dis-m'en plus.",
        "Je suis d'accord avec toi.",
        "On peut en discuter plus tard?",
        "👍",
        "😊",
        "Je vais y réfléchir."
      ];
      
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const replyMessage = addMessage(chatId, randomReply, false);
      addMessageToChat(replyMessage);
      
      const updatedChat = getChatById(chatId);
      updateChatInList({
        ...updatedChat,
        lastMessage: randomReply,
        timestamp: replyMessage.timestamp
      });
    }
  }, 2000);
}

export { initChat };