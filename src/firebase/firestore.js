import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./firebase";

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

// User management functions
export const getUser = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() };
  }
  return null;
};

export const getUserByEmail = async (email) => {
  const { collection: firestoreCollection, query, where, getDocs } = await import("firebase/firestore");
  const usersRef = firestoreCollection(db, "users");
  const q = query(usersRef, where("email", "==", email));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  }
  return null;
};

export const createUser = async (userId, userData) => {
  await setDoc(doc(db, "users", userId), {
    ...userData,
    createdAt: new Date().toISOString(),
  });
};

export const updateUser = async (userId, updates) => {
  return await updateDoc(doc(db, "users", userId), updates);
};

// Access request functions
export const createAccessRequest = async (requestData) => {
  return await addDoc(collection(db, "accessRequests"), {
    ...requestData,
    status: "pending",
    requestedAt: new Date().toISOString(),
  });
};

export const getAccessRequests = async () => {
  const snapshot = await getDocs(collection(db, "accessRequests"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateAccessRequest = async (requestId, updates) => {
  return await updateDoc(doc(db, "accessRequests", requestId), updates);
};

export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteUser = async (userId) => {
  return await deleteDoc(doc(db, "users", userId));
};

// Resource logo upload functions
export const uploadResourceLogo = async (resourceId, file) => {
  // Create a reference to the logo in storage
  const fileExtension = file.name.split('.').pop();
  const storageRef = ref(storage, `resource-logos/${resourceId}.${fileExtension}`);

  // Upload the file
  const snapshot = await uploadBytes(storageRef, file);

  // Get the download URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};

export const deleteResourceLogo = async (logoUrl) => {
  if (!logoUrl) return;

  try {
    // Create a reference from the URL
    const storageRef = ref(storage, logoUrl);
    await deleteObject(storageRef);
  } catch (error) {
    // If the file doesn't exist, that's okay
    if (error.code !== 'storage/object-not-found') {
      throw error;
    }
  }
};

// Bookmark functions
export const addBookmark = async (userId, resourceId) => {
  const { arrayUnion } = await import("firebase/firestore");
  return await updateDoc(doc(db, "users", userId), {
    bookmarks: arrayUnion(resourceId),
  });
};

export const removeBookmark = async (userId, resourceId) => {
  const { arrayRemove } = await import("firebase/firestore");
  return await updateDoc(doc(db, "users", userId), {
    bookmarks: arrayRemove(resourceId),
  });
};