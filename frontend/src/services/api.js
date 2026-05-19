// src/services/api.js
export const sendMessageToApi = async (message) => {
    try {
        const response = await fetch('http://localhost:8000/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question: message }),
          });
          
  
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }
  
      const data = await response.json();
      console.log('Réponse de l\'API:', data);
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la requête:', error);
      throw error;
    }
  };
  
  
  
  