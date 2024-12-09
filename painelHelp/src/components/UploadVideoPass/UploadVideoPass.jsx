import React, { useState, useEffect } from "react";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
  deleteObject,
} from "firebase/storage";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { app, db } from "../../firebase"; // Importando o `app` e `db` já inicializados no firebase.jsx

const storage = getStorage(app);

const UploadVideoPass = () => {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [videoList, setVideoList] = useState([]);

  const fetchVideos = async () => {
    const storageRef = ref(storage, "videoTelaPass");
    const list = await listAll(storageRef);
    const videos = await Promise.all(
      list.items.map(async (item) => ({
        name: item.name,
        url: await getDownloadURL(item),
      }))
    );
    setVideoList(videos);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const maxFileSize = 60 * 1024 * 1024; // 60MB em bytes
    if (selectedFile) {
      if (selectedFile.type !== "video/mp4") {
        alert("Por favor, selecione um arquivo MP4 válido.");
      } else if (selectedFile.size > maxFileSize) {
        alert("O arquivo excede o tamanho máximo de 60MB. Por favor, selecione um arquivo menor.");
      } else {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Selecione um arquivo antes de fazer o upload.");
      return;
    }

    const storageRef = ref(storage, "videoTelaPass");
    const list = await listAll(storageRef);

    if (list.items.length >= 5) {
      alert("Você já possui o número máximo de 5 vídeos. Remova um vídeo antes de fazer o upload.");
      return;
    }

    setUploading(true);
    const fileRef = ref(storage, `videoTelaPass/${file.name}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(progress);
        },
        (error) => {
          console.error("Erro durante o upload:", error);
          setUploading(false);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      
            // Atualize o Firestore adicionando a URL ao array
            const docRef = doc(db, "webPanfleto", "videoTelaPass");
            await updateDoc(docRef, {
              video: arrayUnion(downloadURL),
            });
      
            alert("Upload concluído com sucesso!");
            await fetchVideos(); // Atualiza a lista de vídeos
          } catch (error) {
            console.error("Erro ao atualizar o Firestore:", error);
          } finally {
            setUploading(false);
          }
        }
      );      
  };

  const handleDelete = async (videoName) => {
    const fileRef = ref(storage, `videoTelaPass/${videoName}`);
    try {
      // Obtenha a URL do vídeo antes de deletar
      const videoUrl = await getDownloadURL(fileRef);
  
      // Exclua o arquivo do Storage
      await deleteObject(fileRef);
  
      // Atualize o Firestore removendo a URL do array
      const docRef = doc(db, "webPanfleto", "videoTelaPass");
      await updateDoc(docRef, {
        video: arrayRemove(videoUrl),
      });
  
      alert("Vídeo deletado com sucesso!");
      await fetchVideos(); // Atualiza a lista de vídeos
    } catch (error) {
      console.error("Erro ao deletar vídeo:", error);
    }
  };  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-6 rounded-md shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Upload de Vídeo</h2>
        <input
          type="file"
          accept="video/mp4"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600 border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring focus:ring-blue-300 mb-4"
        />
        {file && (
          <p className="text-sm text-gray-500 mb-4">Arquivo selecionado: {file.name}</p>
        )}
        {uploading ? (
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-blue-500 h-4 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        ) : (
          <button
            onClick={handleUpload}
            className="w-full px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition"
          >
            Fazer Upload
          </button>
        )}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Lista de Vídeos</h3>
          <ul>
            {videoList.map((video) => (
              <li key={video.name} className="flex justify-between items-center mb-2">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline break-all"
                >
                  {video.name}
                </a>
                <button
                  onClick={() => handleDelete(video.name)}
                  className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  Deletar
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadVideoPass;
