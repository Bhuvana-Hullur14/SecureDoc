import { auth, db } from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    deleteDoc,
    doc,
    limit
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";


// ======================================================
// DOM ELEMENTS
// ======================================================

const userName =
    document.getElementById("userName");

const documentCount =
    document.getElementById("documentCount");

const storageUsed =
    document.getElementById("storageUsed");

const activityCount =
    document.getElementById("activityCount");

const certificateCount =
    document.getElementById("certificateCount");

const resumeCount =
    document.getElementById("resumeCount");

const idCount =
    document.getElementById("idCount");

const academicCount =
    document.getElementById("academicCount");

const documentFile =
    document.getElementById("documentFile");

const documentType =
    document.getElementById("documentType");

const uploadBtn =
    document.getElementById("uploadBtn");

const uploadMessage =
    document.getElementById("uploadMessage");

const documentsList =
    document.getElementById("documentsList");

const activityList =
    document.getElementById("activityList");

const searchDocument =
    document.getElementById("searchDocument");

const filterDocument =
    document.getElementById("filterDocument");

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentUser = null;

let allDocuments = [];


// ======================================================
// INDEXEDDB SETTINGS
// ======================================================

const DB_NAME = "SecureDocFileDB";

// Version increased from 1 to 2
const DB_VERSION = 2;

const STORE_NAME = "files";


// ======================================================
// OPEN INDEXEDDB
// ======================================================

function openFileDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded = (event) => {

            const database =
                event.target.result;


            /*
                IMPORTANT:

                We recreate the object store
                without an inline key.

                This allows us to use:

                store.put(file, key)

                correctly.
            */

            if (
                database.objectStoreNames.contains(
                    STORE_NAME
                )
            ) {

                database.deleteObjectStore(
                    STORE_NAME
                );

            }


            database.createObjectStore(
                STORE_NAME
            );

        };


        request.onsuccess = () => {

            resolve(
                request.result
            );

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


// ======================================================
// SAVE FILE LOCALLY
// ======================================================

function saveFileLocally(
    key,
    file
) {

    return new Promise(
        async (resolve, reject) => {

            try {

                const database =
                    await openFileDatabase();


                const transaction =
                    database.transaction(
                        STORE_NAME,
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );


                store.put(
                    file,
                    key
                );


                transaction.oncomplete =
                    () => {

                        database.close();

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        database.close();

                        reject(
                            transaction.error
                        );

                    };

            }

            catch (error) {

                reject(error);

            }

        }
    );

}


// ======================================================
// GET FILE FROM INDEXEDDB
// ======================================================

function getFileLocally(
    key
) {

    return new Promise(
        async (resolve, reject) => {

            try {

                const database =
                    await openFileDatabase();


                const transaction =
                    database.transaction(
                        STORE_NAME,
                        "readonly"
                    );


                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );


                const request =
                    store.get(key);


                request.onsuccess =
                    () => {

                        database.close();

                        resolve(
                            request.result
                        );

                    };


                request.onerror =
                    () => {

                        database.close();

                        reject(
                            request.error
                        );

                    };

            }

            catch (error) {

                reject(error);

            }

        }
    );

}


// ======================================================
// DELETE FILE FROM INDEXEDDB
// ======================================================

function deleteFileLocally(
    key
) {

    return new Promise(
        async (resolve, reject) => {

            try {

                const database =
                    await openFileDatabase();


                const transaction =
                    database.transaction(
                        STORE_NAME,
                        "readwrite"
                    );


                const store =
                    transaction.objectStore(
                        STORE_NAME
                    );


                store.delete(key);


                transaction.oncomplete =
                    () => {

                        database.close();

                        resolve();

                    };


                transaction.onerror =
                    () => {

                        database.close();

                        reject(
                            transaction.error
                        );

                    };

            }

            catch (error) {

                reject(error);

            }

        }
    );

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHTML(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================================
// FORMAT FILE SIZE
// ======================================================

function formatFileSize(bytes) {

    if (!bytes) {

        return "0 MB";

    }


    return (
        bytes /
        (1024 * 1024)
    ).toFixed(2) + " MB";

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(timestamp) {

    if (
        timestamp &&
        typeof timestamp.toDate ===
        "function"
    ) {

        return timestamp
            .toDate()
            .toLocaleString();

    }


    return "Just now";

}


// ======================================================
// AUTH STATE
// ======================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            currentUser = user;


            if (userName) {

                userName.textContent =
                    user.displayName ||
                    "Student";

            }


            loadDocuments(
                user.uid
            );


            loadActivities(
                user.uid
            );

        }

        else {

            window.location.href =
                "login.html";

        }

    }
);


// ======================================================
// UPLOAD DOCUMENT
// ======================================================

if (uploadBtn) {

    uploadBtn.addEventListener(
        "click",
        async () => {

            if (!currentUser) {

                uploadMessage.textContent =
                    "Please login first.";

                return;

            }


            const file =
                documentFile.files[0];


            const type =
                documentType.value;


            if (!file) {

                uploadMessage.textContent =
                    "Please select a document.";

                return;

            }


            if (!type) {

                uploadMessage.textContent =
                    "Please select a document type.";

                return;

            }


            // Allowed file types

            const allowedTypes = [

                "application/pdf",

                "image/jpeg",

                "image/png"

            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                uploadMessage.textContent =
                    "Only PDF, JPG and PNG files are allowed.";

                return;

            }


            // Maximum 5 MB

            const maxSize =
                5 * 1024 * 1024;


            if (
                file.size > maxSize
            ) {

                uploadMessage.textContent =
                    "File size must be less than 5 MB.";

                return;

            }


            uploadBtn.disabled = true;


            uploadMessage.textContent =
                "Uploading document...";


            try {

                // Unique key for IndexedDB

                const previewKey =
                    currentUser.uid +
                    "_" +
                    Date.now() +
                    "_" +
                    file.name;


                // Save actual file locally

                await saveFileLocally(
                    previewKey,
                    file
                );


                // Save metadata in Firestore

                await addDoc(
                    collection(
                        db,
                        "documents"
                    ),
                    {

                        fileName:
                            file.name,

                        documentType:
                            type,

                        fileSize:
                            file.size,

                        fileType:
                            file.type,

                        previewKey:
                            previewKey,

                        userId:
                            currentUser.uid,

                        userEmail:
                            currentUser.email,

                        createdAt:
                            serverTimestamp()

                    }
                );


                // Save activity

                await addDoc(
                    collection(
                        db,
                        "activities"
                    ),
                    {

                        action:
                            "Uploaded",

                        fileName:
                            file.name,

                        userId:
                            currentUser.uid,

                        userEmail:
                            currentUser.email,

                        createdAt:
                            serverTimestamp()

                    }
                );


                uploadMessage.textContent =
                    "Document uploaded successfully!";


                documentFile.value =
                    "";

                documentType.value =
                    "";


                setTimeout(
                    () => {

                        uploadMessage.textContent =
                            "";

                    },
                    3000
                );

            }

            catch (error) {

                console.error(
                    "Upload error:",
                    error
                );


                uploadMessage.textContent =
                    "Upload failed: " +
                    error.message;

            }

            finally {

                uploadBtn.disabled =
                    false;

            }

        }
    );

}


// ======================================================
// LOAD DOCUMENTS
// ======================================================

function loadDocuments(
    userId
) {

    const documentsQuery =
        query(
            collection(
                db,
                "documents"
            ),

            where(
                "userId",
                "==",
                userId
            )
        );


    onSnapshot(
        documentsQuery,

        (snapshot) => {

            allDocuments = [];


            let totalStorage = 0;

            let certificates = 0;

            let resumes = 0;

            let ids = 0;

            let academics = 0;


            snapshot.forEach(
                (documentSnapshot) => {

                    const data =
                        documentSnapshot.data();


                    allDocuments.push({

                        id:
                            documentSnapshot.id,

                        ...data

                    });


                    totalStorage +=
                        data.fileSize || 0;


                    if (
                        data.documentType ===
                        "Certificate"
                    ) {

                        certificates++;

                    }


                    if (
                        data.documentType ===
                        "Resume"
                    ) {

                        resumes++;

                    }


                    if (
                        data.documentType ===
                        "ID Document"
                    ) {

                        ids++;

                    }


                    if (
                        data.documentType ===
                        "Academic Document"
                    ) {

                        academics++;

                    }

                }
            );


            // Dashboard statistics

            documentCount.textContent =
                allDocuments.length;


            storageUsed.textContent =
                formatFileSize(
                    totalStorage
                );


            certificateCount.textContent =
                certificates;


            resumeCount.textContent =
                resumes;


            idCount.textContent =
                ids;


            academicCount.textContent =
                academics;


            displayDocuments();

        },

        (error) => {

            console.error(
                "Document error:",
                error
            );


            documentsList.innerHTML = `
                <p class="empty-message">
                    Unable to load documents.
                </p>
            `;

        }
    );

}


// ======================================================
// DISPLAY DOCUMENTS
// ======================================================

function displayDocuments() {

    if (!documentsList) {

        return;

    }


    const searchText =
        searchDocument
            ? searchDocument.value
                .toLowerCase()
                .trim()
            : "";


    const selectedFilter =
        filterDocument
            ? filterDocument.value
            : "All";


    const filteredDocuments =
        allDocuments.filter(
            (documentData) => {

                const matchesSearch =
                    documentData.fileName
                        .toLowerCase()
                        .includes(
                            searchText
                        );


                const matchesFilter =
                    selectedFilter ===
                    "All" ||
                    documentData.documentType ===
                    selectedFilter;


                return (
                    matchesSearch &&
                    matchesFilter
                );

            }
        );


    documentsList.innerHTML =
        "";


    if (
        filteredDocuments.length === 0
    ) {

        documentsList.innerHTML = `
            <p class="empty-message">
                No documents uploaded yet.
            </p>
        `;

        return;

    }


    filteredDocuments.forEach(
        (documentData) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "document-card";


            card.innerHTML = `

                <div class="document-info">

                    <div class="document-icon">
                        📄
                    </div>

                    <div class="document-details">

                        <h3>
                            ${escapeHTML(
                                documentData.fileName
                            )}
                        </h3>

                        <p class="document-type">
                            ${escapeHTML(
                                documentData.documentType
                            )}
                        </p>

                        <p>
                            ${formatFileSize(
                                documentData.fileSize
                            )}
                        </p>

                        <p>
                            Uploaded:
                            ${formatDate(
                                documentData.createdAt
                            )}
                        </p>

                    </div>

                </div>


                <div class="document-actions">

                    <button
                        class="preview-btn"
                        data-id="${documentData.id}"
                    >
                        👁 Preview
                    </button>

                    <button
                        class="delete-btn"
                        data-id="${documentData.id}"
                    >
                        🗑 Delete
                    </button>

                </div>

            `;


            documentsList.appendChild(
                card
            );

        }
    );


    // Preview buttons

    document
        .querySelectorAll(
            ".preview-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;


                        previewDocument(
                            id
                        );

                    }
                );

            }
        );


    // Delete buttons

    document
        .querySelectorAll(
            ".delete-btn"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;


                        deleteDocument(
                            id
                        );

                    }
                );

            }
        );

}


// ======================================================
// PREVIEW DOCUMENT
// ======================================================

async function previewDocument(
    documentId
) {

    const documentData =
        allDocuments.find(
            (item) =>
                item.id === documentId
        );


    if (!documentData) {

        alert(
            "Document not found."
        );

        return;

    }


    try {

        const file =
            await getFileLocally(
                documentData.previewKey
            );


        if (!file) {

            alert(
                "The actual file is not available in this browser. Please delete this document and upload the file again."
            );

            return;

        }


        const fileURL =
            URL.createObjectURL(
                file
            );


        const previewWindow =
            window.open(
                "",
                "_blank"
            );


        if (!previewWindow) {

            alert(
                "Please allow pop-ups to preview the document."
            );


            URL.revokeObjectURL(
                fileURL
            );


            return;

        }


        // PDF preview

        if (
            file.type ===
            "application/pdf"
        ) {

            previewWindow.document.write(`

                <!DOCTYPE html>

                <html>

                <head>

                    <title>
                        ${escapeHTML(
                            file.name
                        )}
                    </title>

                    <style>

                        body {
                            margin: 0;
                            background: #222;
                        }

                        iframe {
                            width: 100%;
                            height: 100vh;
                            border: none;
                        }

                    </style>

                </head>

                <body>

                    <iframe
                        src="${fileURL}"
                    ></iframe>

                </body>

                </html>

            `);

        }

        // Image preview

        else {

            previewWindow.document.write(`

                <!DOCTYPE html>

                <html>

                <head>

                    <title>
                        ${escapeHTML(
                            file.name
                        )}
                    </title>

                    <style>

                        body {
                            margin: 0;
                            padding: 20px;
                            background: #222;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                        }

                        img {
                            max-width: 100%;
                            max-height: 95vh;
                            object-fit: contain;
                        }

                    </style>

                </head>

                <body>

                    <img
                        src="${fileURL}"
                        alt="Document Preview"
                    >

                </body>

                </html>

            `);

        }


        previewWindow.document.close();


        previewWindow.addEventListener(
            "beforeunload",
            () => {

                URL.revokeObjectURL(
                    fileURL
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Preview error:",
            error
        );


        alert(
            "Unable to preview this document."
        );

    }

}


// ======================================================
// DELETE DOCUMENT
// ======================================================

async function deleteDocument(
    documentId
) {

    const documentData =
        allDocuments.find(
            (item) =>
                item.id === documentId
        );


    if (!documentData) {

        return;

    }


    const confirmDelete =
        confirm(
            `Are you sure you want to delete "${documentData.fileName}"?`
        );


    if (!confirmDelete) {

        return;

    }


    try {

        // Delete actual file from IndexedDB

        if (
            documentData.previewKey
        ) {

            await deleteFileLocally(
                documentData.previewKey
            );

        }


        // Add delete activity

        await addDoc(
            collection(
                db,
                "activities"
            ),
            {

                action:
                    "Deleted",

                fileName:
                    documentData.fileName,

                userId:
                    currentUser.uid,

                userEmail:
                    currentUser.email,

                createdAt:
                    serverTimestamp()

            }
        );


        // Delete Firestore metadata

        await deleteDoc(
            doc(
                db,
                "documents",
                documentId
            )
        );


        alert(
            "Document deleted successfully."
        );

    }

    catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            "Unable to delete document: " +
            error.message
        );

    }

}


// ======================================================
// LOAD ACTIVITIES
// ======================================================

function loadActivities(
    userId
) {

    /*
        We don't use orderBy() here.

        This avoids needing a Firestore
        composite index.
    */

    const activitiesQuery =
        query(
            collection(
                db,
                "activities"
            ),

            where(
                "userId",
                "==",
                userId
            ),

            limit(10)
        );


    onSnapshot(

        activitiesQuery,

        (snapshot) => {

            if (!activityList) {

                return;

            }


            activityList.innerHTML =
                "";


            activityCount.textContent =
                snapshot.size;


            if (snapshot.empty) {

                activityList.innerHTML = `
                    <p class="empty-message">
                        No activity yet.
                    </p>
                `;

                return;

            }


            const activities = [];


            snapshot.forEach(
                (activitySnapshot) => {

                    const data =
                        activitySnapshot.data();


                    activities.push(
                        data
                    );

                }
            );


            // Newest activity first

            activities.sort(
                (a, b) => {

                    const dateA =
                        a.createdAt &&
                        typeof a.createdAt.toDate ===
                        "function"
                            ? a.createdAt.toDate()
                            : new Date(0);


                    const dateB =
                        b.createdAt &&
                        typeof b.createdAt.toDate ===
                        "function"
                            ? b.createdAt.toDate()
                            : new Date(0);


                    return dateB - dateA;

                }
            );


            activities.forEach(
                (data) => {

                    const icon =
                        data.action ===
                        "Uploaded"
                            ? "📤"
                            : "🗑️";


                    const date =
                        data.createdAt &&
                        typeof data.createdAt.toDate ===
                        "function"
                            ? data.createdAt
                                .toDate()
                                .toLocaleString()
                            : "Just now";


                    const activity =
                        document.createElement(
                            "div"
                        );


                    activity.className =
                        "activity-item";


                    activity.innerHTML = `

                        <p>

                            ${icon}

                            <strong>
                                ${escapeHTML(
                                    data.action
                                )}
                            </strong>

                            ${escapeHTML(
                                data.fileName
                            )}

                        </p>

                        <small>
                            ${date}
                        </small>

                    `;


                    activityList.appendChild(
                        activity
                    );

                }
            );

        },

        (error) => {

            console.error(
                "Activity error:",
                error
            );


            if (activityCount) {

                activityCount.textContent =
                    "0";

            }


            if (activityList) {

                activityList.innerHTML = `
                    <p class="empty-message">
                        Unable to load activities.
                    </p>
                `;

            }

        }

    );

}


// ======================================================
// SEARCH
// ======================================================

if (searchDocument) {

    searchDocument.addEventListener(
        "input",
        () => {

            displayDocuments();

        }
    );

}


// ======================================================
// FILTER
// ======================================================

if (filterDocument) {

    filterDocument.addEventListener(
        "change",
        () => {

            displayDocuments();

        }
    );

}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                window.location.href =
                    "login.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                alert(
                    "Unable to logout."
                );

            }

        }
    );

}