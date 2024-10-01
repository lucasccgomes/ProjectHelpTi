import CryptoJS from 'crypto-js';

// Utilize a chave secreta da variável de ambiente
const secretKey = import.meta.env.VITE_SECRET_KEY;

// Verifique se a chave secreta está disponível
if (!secretKey) {
  console.error('Chave secreta não encontrada! Verifique as variáveis de ambiente.');
}

// Função para criptografar dados
const encryptData = (data) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  } catch (error) {
    console.error('Erro ao criptografar os dados:', error);
    return null;
  }
};

// Função para descriptografar dados
const decryptData = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Erro ao descriptografar os dados:', error);
    return null;
  }
};

// Função para armazenar dados no localStorage de forma segura
export const saveToLocalStorage = (key, data) => {
  const encryptedData = encryptData(data);
  if (encryptedData) {
    localStorage.setItem(key, encryptedData);
  }
};

// Função para recuperar dados do localStorage de forma segura
export const getFromLocalStorage = (key) => {
  const encryptedData = localStorage.getItem(key);
  if (!encryptedData) return null;
  return decryptData(encryptedData);
};
