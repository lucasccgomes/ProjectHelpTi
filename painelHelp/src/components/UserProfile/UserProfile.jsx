import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AlertModal from '../AlertModal/AlertModal';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../cropImage';
import { FaWhatsapp, FaPencilAlt } from "react-icons/fa";
import { FaUser, FaCity, FaStoreAlt } from "react-icons/fa";
import MyModal from '../MyModal/MyModal';
import InputMask from 'react-input-mask';


const UserProfile = () => {
    const { currentUser } = useAuth(); // Obtém o usuário autenticado atual
    const [newPassword, setNewPassword] = useState(''); // Estado para armazenar a nova senha
    const [newWhatsapp, setNewWhatsapp] = useState(currentUser.whatsapp || ''); // Estado para armazenar o novo número de WhatsApp
    const [imageFile, setImageFile] = useState(null); // Estado para armazenar o arquivo de imagem selecionado
    const [imageUrl, setImageUrl] = useState(currentUser?.imageUrl || ''); // Estado para armazenar a URL da imagem de perfil
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false); // Estado para controlar a abertura do modal de alerta
    const [alertMessage, setAlertMessage] = useState(''); // Estado para armazenar a mensagem de alerta
    const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false); // Estado para controlar a abertura do modal de WhatsApp

    // Estado para o Cropper (ferramenta de recorte de imagem)
    const [crop, setCrop] = useState({ x: 0, y: 0 }); // Estado para armazenar a posição de recorte
    const [zoom, setZoom] = useState(1); // Estado para armazenar o nível de zoom do recorte
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null); // Estado para armazenar a área de pixels recortados
    const [croppedImage, setCroppedImage] = useState(null); // Estado para armazenar a imagem recortada
    const [isCropModalOpen, setIsCropModalOpen] = useState(false); // Estado para controlar a abertura do modal de recorte

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels); // Atualiza o estado com a área de pixels recortados
    }, []);

    const validatePassword = (password) => {
        const numberPattern = /[0-9]{4,}/; // Padrão para verificar se há pelo menos 4 números na senha
        const letterPattern = /[a-zA-Z]{2,}/; // Padrão para verificar se há pelo menos 2 letras na senha
        return numberPattern.test(password) && letterPattern.test(password); // Retorna true se a senha atender aos requisitos
    };

    const handlePasswordChange = async () => {
        if (!validatePassword(newPassword)) { // Verifica se a nova senha atende aos requisitos
            setAlertMessage('A senha deve ter no mínimo 4 números e 2 letras.');
            setIsAlertModalOpen(true); // Abre o modal de alerta se a senha for inválida
            return;
        }

        try {
            const userDoc = doc(db, 'usuarios', currentUser.cidade); // Referência ao documento do usuário no Firestore
            await updateDoc(userDoc, {
                [`${currentUser.user}.pass`]: newPassword, // Atualiza a senha no Firestore
            });
            setAlertMessage('Senha atualizada com sucesso!');
            setIsAlertModalOpen(true); // Abre o modal de alerta com mensagem de sucesso
        } catch (error) {
            console.error('Erro ao atualizar a senha:', error); // Loga o erro se a atualização falhar
            setAlertMessage('Erro ao atualizar a senha. Tente novamente.');
            setIsAlertModalOpen(true); // Abre o modal de alerta com mensagem de erro
        }
    };

    const handleImageUpload = async () => {
        const storage = getStorage(); // Obtém a instância do serviço de armazenamento
        const storageRef = ref(storage, `users/${currentUser.user}/profile.jpg`); // Referência ao local de armazenamento da imagem

        try {
            const croppedBlob = await getCroppedImg(croppedImage, croppedAreaPixels); // Obtém o blob da imagem recortada
            await uploadBytes(storageRef, croppedBlob); // Faz upload da imagem recortada
            const downloadURL = await getDownloadURL(storageRef); // Obtém a URL de download da imagem
            setImageUrl(downloadURL); // Atualiza a URL da imagem de perfil no estado

            const userDoc = doc(db, 'usuarios', currentUser.cidade); // Referência ao documento do usuário no Firestore
            await updateDoc(userDoc, {
                [`${currentUser.user}.imageUrl`]: downloadURL, // Atualiza a URL da imagem de perfil no Firestore
            });

            setAlertMessage('Imagem atualizada com sucesso!');
            setIsAlertModalOpen(true); // Abre o modal de alerta com mensagem de sucesso
            setIsCropModalOpen(false); // Fecha o modal de recorte de imagem
        } catch (error) {
            console.error('Erro ao fazer upload da imagem:', error); // Loga o erro se o upload falhar
            setAlertMessage('Erro ao fazer upload da imagem. Tente novamente.');
            setIsAlertModalOpen(true); // Abre o modal de alerta com mensagem de erro
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0]; // Obtém o arquivo de imagem selecionado
        if (file) {
            const reader = new FileReader(); // Cria um novo FileReader para ler o arquivo
            reader.readAsDataURL(file); // Lê o arquivo como URL de dados
            reader.onload = () => {
                setCroppedImage(reader.result); // Armazena a imagem recortada no estado
                setIsCropModalOpen(true); // Abre o modal de recorte de imagem
            };
        }
    };

    const handleWhatsappChange = async () => {
        try {
            const userDoc = doc(db, 'usuarios', currentUser.cidade); // Referência ao documento do usuário no Firestore
            await updateDoc(userDoc, {
                [`${currentUser.user}.whatsapp`]: newWhatsapp, // Atualiza o número de WhatsApp no Firestore
            });

            // Atualizar o estado do usuário para refletir a mudança em tempo real
            currentUser.whatsapp = newWhatsapp; // Atualiza o número de WhatsApp no estado do usuário

            setAlertMessage('Número de WhatsApp atualizado com sucesso!');
            setIsAlertModalOpen(true); // Abre o modal de alerta com mensagem de sucesso
            setIsWhatsappModalOpen(false); // Fecha o modal de edição de WhatsApp
        } catch (error) {
            console.error('Erro ao atualizar o número de WhatsApp:', error); // Loga o erro se a atualização falhar
            setAlertMessage('Erro ao atualizar o número de WhatsApp. Tente novamente.');
            setIsAlertModalOpen(true); // Abre o modal de alerta com mensagem de erro
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 bg-white shadow-md rounded-lg">
            <div className='flex flex-row-reverse justify-between gap-4'>
                <div className="flex flex-col justify-center items-center">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Profile"
                            className="w-32 h-32 object-cover rounded-full mb-2"
                        />
                    ) : (
                        <div className="w-32 h-32 flex items-center justify-center bg-gray-200 rounded-full mb-2">
                            <span className="text-gray-500">
                                Adicionar Foto
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => document.getElementById('fileInput').click()}
                        className="px-4 py-2 bg-primaryBlueDark text-white rounded-md hover:bg-primaryOpaci focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        {imageUrl ? 'Alterar Foto' : 'Adicionar Foto'}
                    </button>
                    <input
                        id="fileInput"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>

                <div className='flex flex-col gap-2 justify-start items-start'>
                    <div className="flex justify-center gap-1 items-center">
                        <div className='text-primaryOpaci'>
                            <FaUser />
                        </div>
                        <p className='text-gray-700'>
                            {currentUser.user}
                        </p>
                    </div>
                    <div className="flex justify-center gap-1 items-center">
                        <div className='text-primaryOpaci'>
                            <FaCity />
                        </div>
                        <p className='text-gray-700'>
                            {currentUser.cidade}
                        </p>
                    </div>
                    <div className="flex justify-center gap-1 items-center">
                        <div className='text-primaryOpaci'>
                            <FaStoreAlt />
                        </div>
                        <p className='text-gray-700'>
                            {currentUser.loja}
                        </p>
                    </div>
                    <div className="flex justify-center gap-1 items-center">
                        <div className='text-primaryOpaci'>
                            <FaWhatsapp />
                        </div>
                        <p className='text-gray-700 text-xs lg:text-base'>
                            {newWhatsapp}
                        </p>
                        <FaPencilAlt
                            className="text-gray-500 cursor-pointer hover:text-gray-700"
                            onClick={() => setIsWhatsappModalOpen(true)}
                        />
                    </div>
                </div>
            </div>
            <div className="mb-4">
                <label className="block text-gray-700">Nova Senha</label>
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Nova Senha"
                />
            </div>
            <button
                onClick={handlePasswordChange}
                className="w-full bg-primaryBlueDark text-white py-2 rounded-md hover:bg-primaryOpaci"
            >
                Atualizar Senha
            </button>

            <AlertModal
                isOpen={isAlertModalOpen}
                onRequestClose={() => setIsAlertModalOpen(false)}
                title="Alerta"
                message={alertMessage}
            />

            {/* Modal para alterar WhatsApp */}
            <MyModal
                isOpen={isWhatsappModalOpen}
                onClose={() => setIsWhatsappModalOpen(false)}
            >
                <h2 className="text-xl mb-4">
                    Alterar Número de WhatsApp
                </h2>
                <InputMask
                    mask="(99) 99999-9999"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md mb-4"
                    placeholder="Novo Número de WhatsApp"
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleWhatsappChange}
                        className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 mr-2"
                    >
                        Salvar
                    </button>
                    <button
                        onClick={() => setIsWhatsappModalOpen(false)}
                        className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                    >
                        Cancelar
                    </button>
                </div>
            </MyModal>

            {/* Modal para cortar imagem */}
            <MyModal
                isOpen={isCropModalOpen}
                onClose={() => setIsCropModalOpen(false)} // Note que `onClose` é usado em vez de `onRequestClose`
            >
                <div className="relative w-full h-64">
                    <Cropper
                        image={croppedImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                </div>
                <div className="mt-4 flex justify-between">
                    <button
                        onClick={handleImageUpload}
                        className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
                    >
                        Salvar
                    </button>
                    <button
                        onClick={() => setIsCropModalOpen(false)}
                        className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                    >
                        Cancelar
                    </button>
                </div>
            </MyModal>
        </div>
    );
};

export default UserProfile;
