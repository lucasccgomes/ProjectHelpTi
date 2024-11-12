import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import MyModal from '../MyModal/MyModal';
import AlertModal from '../AlertModal/AlertModal';

const MarketingMp3 = () => {
    const [servers, setServers] = useState([]);
    const [selectedServer, setSelectedServer] = useState('');
    const [file, setFile] = useState(null);
    const [files, setFiles] = useState([]);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [alertIsOpen, setAlertIsOpen] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [alertLoading, setAlertLoading] = useState(false);


    const MP3_LIST_API_URL = import.meta.env.VITE_MP3_LIST;
    const MP3_UPLOAD_API_URL = import.meta.env.VITE_MP3_UPLOAD;
    const VITE_MP3_DELETE_API_URL = import.meta.env.VITE_MP3_DELETE;

    // Função para abrir o AlertModal com título, mensagem e estado de carregamento específicos
    const showAlert = (title, message, loading = false) => {
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertLoading(loading);
        setAlertIsOpen(true);
    };

    useEffect(() => {
        const fetchServers = async () => {
            try {
                const serverCollection = collection(db, "grenciaServers");
                const serverSnapshot = await getDocs(serverCollection);
                const serversList = serverSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setServers(serversList);
            } catch (error) {
                console.error("Erro ao carregar servidores:", error);
            }
        };
        fetchServers();
    }, []);

    const fetchFiles = async (serverId) => {
        try {
            const response = await fetch(MP3_LIST_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId })
            });
            const data = await response.json();
            setFiles(data.files);
        } catch (error) {
            console.error("Erro na solicitação de listagem de arquivos:", error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "audio/mpeg") {
            setFile(selectedFile);
        } else {
            showAlert("Erro de arquivo", "Por favor, selecione um arquivo MP3.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedServer || !file) {
            showAlert("Erro de envio", "Por favor, selecione uma loja e um arquivo MP3.");
            return;
        }

        setModalIsOpen(true);
        setProgress(0);
        setUploadComplete(false);

        const formData = new FormData();
        formData.append('serverId', selectedServer);
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", MP3_UPLOAD_API_URL, true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 90;
                setProgress(Math.round(percentComplete));
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.message === "Arquivo enviado com sucesso!") {
                    setProgress(100);
                    setUploadComplete(true);
                    fetchFiles(selectedServer);
                } else {
                    showAlert("Erro de envio", response.error || "Erro ao enviar o arquivo.");
                    setModalIsOpen(false);
                }
            } else {
                showAlert("Erro de envio", "Erro ao enviar o arquivo.");
                setModalIsOpen(false);
            }
        };

        xhr.onerror = () => {
            showAlert("Erro de conexão", "Erro ao enviar o arquivo.");
            setModalIsOpen(false);
        };

        xhr.send(formData);
    };

    const handleDelete = async (filename) => {
        showAlert("Deletando", "Enviando solicitação...", true); // Define o modal como "carregando"
        try {
            const response = await fetch(VITE_MP3_DELETE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId: selectedServer, filename })
            });
            const data = await response.json();

            if (response.ok) {
                showAlert("Sucesso", data.message || "Arquivo deletado com sucesso!");
                fetchFiles(selectedServer);
            } else {
                showAlert("Erro de exclusão", data.error || "Erro ao deletar o arquivo.");
            }
        } catch (error) {
            console.error("Erro ao deletar o arquivo:", error);
            showAlert("Erro de exclusão", "Erro ao deletar o arquivo.");
        } finally {
            setAlertLoading(false); // Remove o estado de "carregando" ao final da requisição
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 mt-24 bg-white shadow-md rounded-md">
            <h2 className="text-2xl font-semibold text-center mb-4">Upload de MP3 para Lojas</h2>

            <form onSubmit={handleSubmit}>
                <label htmlFor="server" className="block text-sm font-medium text-gray-700">
                    Selecionar Loja
                </label>
                <select
                    id="server"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={selectedServer}
                    onChange={(e) => {
                        setSelectedServer(e.target.value);
                        fetchFiles(e.target.value);
                    }}
                >
                    <option value="">Selecione uma Loja</option>
                    {servers.map((server) => (
                        <option key={server.id} value={server.id}>
                            {server.id}
                        </option>
                    ))}
                </select>

                <label htmlFor="file" className="block text-sm font-medium text-gray-700 mt-4">
                    Selecione o arquivo MP3
                </label>
                <input
                    type="file"
                    id="file"
                    accept=".mp3"
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    onChange={handleFileChange}
                />

                <button
                    type="submit"
                    className="mt-4 w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    disabled={loading}
                >
                    Enviar MP3
                </button>
            </form>

            <h3 className="text-xl font-semibold text-center mt-8">Arquivos MP3 na Loja</h3>
            <ul className="mt-4">
                {files.map((filename) => (
                    <li key={filename} className="flex justify-between items-center p-2 border-b">
                        <span>{filename}</span>
                        <button
                            onClick={() => handleDelete(filename)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                            Excluir
                        </button>
                    </li>
                ))}
            </ul>

            <MyModal isOpen={modalIsOpen} showCloseButton={false}>
                <div className="text-center">
                    <h2 className="text-lg font-semibold">Enviando arquivo...</h2>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                        <div
                            className="bg-indigo-600 h-2.5 rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    {progress === 100 && (
                        <>
                            <p className="mt-2 text-green-600">Upload concluído com sucesso!</p>
                            <button
                                onClick={() => setModalIsOpen(false)}
                                className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                            >
                                OK
                            </button>
                        </>
                    )}
                </div>
            </MyModal>

            <AlertModal
                isOpen={alertIsOpen}
                onRequestClose={() => setAlertIsOpen(false)}
                title={alertTitle}
                message={alertMessage}
                showOkButton={!alertLoading}
                loading={alertLoading}
            />
        </div>
    );
};

export default MarketingMp3;
