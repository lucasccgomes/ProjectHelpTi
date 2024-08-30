import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import AlertModal from '../AlertModal/AlertModal';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../cropImage';
import { FaWhatsapp, FaPencilAlt } from "react-icons/fa";
import Modal from 'react-modal';
import { FaUser, FaCity, FaStoreAlt } from "react-icons/fa";
import { useSpring, animated } from '@react-spring/web';
import MyModal from '../MyModal/MyModal';
import InputMask from 'react-input-mask';


const UserProfile = () => {
    const { currentUser } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [newWhatsapp, setNewWhatsapp] = useState(currentUser.whatsapp || '');
    const [imageFile, setImageFile] = useState(null);
    const [imageUrl, setImageUrl] = useState(currentUser?.imageUrl || '');
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);

    // Cropper state
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const validatePassword = (password) => {
        const numberPattern = /[0-9]{4,}/;
        const letterPattern = /[a-zA-Z]{2,}/;
        return numberPattern.test(password) && letterPattern.test(password);
    };

    const handlePasswordChange = async () => {
        if (!validatePassword(newPassword)) {
            setAlertMessage('A senha deve ter no mínimo 4 números e 2 letras.');
            setIsAlertModalOpen(true);
            return;
        }

        try {
            const userDoc = doc(db, 'usuarios', currentUser.cidade);
            await updateDoc(userDoc, {
                [`${currentUser.user}.pass`]: newPassword,
            });
            setAlertMessage('Senha atualizada com sucesso!');
            setIsAlertModalOpen(true);
        } catch (error) {
            console.error('Erro ao atualizar a senha:', error);
            setAlertMessage('Erro ao atualizar a senha. Tente novamente.');
            setIsAlertModalOpen(true);
        }
    };

    const handleImageUpload = async () => {
        const storage = getStorage();
        const storageRef = ref(storage, `users/${currentUser.user}/profile.jpg`);

        try {
            const croppedBlob = await getCroppedImg(croppedImage, croppedAreaPixels); // Obtenha o blob da imagem cortada
            await uploadBytes(storageRef, croppedBlob);
            const downloadURL = await getDownloadURL(storageRef);
            setImageUrl(downloadURL);

            const userDoc = doc(db, 'usuarios', currentUser.cidade);
            await updateDoc(userDoc, {
                [`${currentUser.user}.imageUrl`]: downloadURL,
            });

            setAlertMessage('Imagem atualizada com sucesso!');
            setIsAlertModalOpen(true);
            setIsCropModalOpen(false);
        } catch (error) {
            console.error('Erro ao fazer upload da imagem:', error);
            setAlertMessage('Erro ao fazer upload da imagem. Tente novamente.');
            setIsAlertModalOpen(true);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                setCroppedImage(reader.result);
                setIsCropModalOpen(true);
            };
        }
    };

    const handleWhatsappChange = async () => {
        try {
            const userDoc = doc(db, 'usuarios', currentUser.cidade);
            await updateDoc(userDoc, {
                [`${currentUser.user}.whatsapp`]: newWhatsapp,
            });

            // Atualizar o estado do usuário para refletir a mudança em tempo real
            currentUser.whatsapp = newWhatsapp;

            setAlertMessage('Número de WhatsApp atualizado com sucesso!');
            setIsAlertModalOpen(true);
            setIsWhatsappModalOpen(false);
        } catch (error) {
            console.error('Erro ao atualizar o número de WhatsApp:', error);
            setAlertMessage('Erro ao atualizar o número de WhatsApp. Tente novamente.');
            setIsAlertModalOpen(true);
        }
    };

    // Animação do modal
    const animationProps = useSpring({
        opacity: isWhatsappModalOpen || isCropModalOpen ? 1 : 0,
        transform: isWhatsappModalOpen || isCropModalOpen ? 'translateY(0)' : 'translateY(-20%)',
    });

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
