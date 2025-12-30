import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "./config";

export const getResources = async () => {
  const snapshot = await getDocs(collection(db, "resources"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addResource = async (resource) => {
  return await addDoc(collection(db, "resources"), resource);
};

export const updateResource = async (id, updates) => {
  return await updateDoc(doc(db, "resources", id), updates);
};

export const deleteResource = async (id) => {
  return await deleteDoc(doc(db, "resources", id));
};