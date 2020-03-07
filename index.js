// Import stylesheets
import "./style.css";

// Firebase App (the core Firebase SDK) is always required
// and must be listed first
import * as firebase from "firebase/app";

// Add the Firebase products that you want to use
import "firebase/auth";
import "firebase/firestore";

import * as firebaseui from "firebaseui";

// Document elements
const startRsvpButton = document.getElementById('startRsvp');
const guestbookContainer = document.getElementById('guestbook-container');

const form = document.getElementById('leave-message');
const input = document.getElementById('message');
const guestbook = document.getElementById('guestbook');
const numberAttending = document.getElementById('number-attending');
const rsvpYes = document.getElementById('rsvp-yes');
const rsvpNo = document.getElementById('rsvp-no');

var rsvpListener = null;
var guestbookListener = null;

// Add Firebase project configuration object here
// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyBy496uxYqx4esOq1pZE2HEIPk5osPu6hA",
  authDomain: "fb-study-jam-bsb.firebaseapp.com",
  databaseURL: "https://fb-study-jam-bsb.firebaseio.com",
  projectId: "fb-study-jam-bsb",
  storageBucket: "fb-study-jam-bsb.appspot.com",
  messagingSenderId: "245576326607",
  appId: "1:245576326607:web:8f232c738974929a7246ba",
  measurementId: "G-SHE8V28DCK"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore referência do banco de dados
const commentsDbRef = firebase.firestore().collection("comentarios");
const attendeesDbRef = firebase.firestore().collection("attendees");


// FirebaseUI config
const uiConfig = {
  credentialHelper: firebaseui.auth.CredentialHelper.NONE,
  signInOptions: [
    // Email / Password Provider.
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl){
      // Handle sign-in.
      // Return false to avoid redirect.
      return false;
    }
  }
};

const ui = new firebaseui.auth.AuthUI(firebase.auth());

// Adiciona um listener para saber se o usuário clicou no botão Participar
startRsvpButton.addEventListener('click', () => {
  if (firebase.auth().currentUser) {
    // Usuário logado
    firebase.auth().signOut()
  } else {
    // Usuário não logado
      ui.start("#firebaseui-auth-container", uiConfig)
    }
});

// Adiciona um componente para checar se o usuário está logado
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    startRsvpButton.textContent = "LOGOUT";

    // Mostra os comentários somente para usuários logados
    guestbookContainer.style.display = "block"
    subscribeGuestbook();
    subscribeCurrentRSVP(user);
  } else {
    startRsvpButton.textContent = "Participar";

    //Esconde os comentáriopara quem não estiver logado
    guestbookContainer.style.display = "none";
    unsubscribeGuestbook();
    unsubscribeCurrentRSVP();
  }
});

// Pega o input do comentário e salva no banco de dados
form.addEventListener('submit', e => {
  // Inpede a página de recarregar
  e.preventDefault();

  // Adiciona o comentário no banco de dados
  commentsDbRef.add({
    text: input.value,
    timestamp: Date.now(),
    name: firebase.auth().currentUser.displayName,
    userId: firebase.auth().currentUser.uid
  });

  // Limpa o texto do input 
  input.value = "";

  // Impede o redirecionamento
  return false;
});

// pode ver os comentários e participar
function subscribeGuestbook() {
  
  // Recupera as mensagens do banco de dados 
  guestbookListener = commentsDbRef.orderBy('timestamp', 'desc').onSnapshot(messages => {
    // Limpa o conteúdo da section
    guestbook.innerHTML = "";

    // Itera pelas mensagens para mostrar
    messages.forEach(message => {
      // Cria um novo elemento para contar a mensagem
      const newMessage = document.createElement("p");
      newMessage.textContent = `${message.data().name}: ${message.data().text}.`;
      guestbook.appendChild(newMessage);
    })
  });
};
// Não pode ver os comentários e participar
function unsubscribeGuestbook(){
 if (guestbookListener != null)
 {
   guestbookListener();
   guestbookListener = null;
 }
};

// Registra o click em sim e salva no banco de dados que o usuário vai
rsvpYes.onclick = () => {
  const userDoc = attendeesDbRef.doc(firebase.auth().currentUser.uid);
  userDoc.set({
    attending: true
  }).catch(console.error);
};

// Registra o click em Não e salva no banco de dados que o usuário Não vai
rsvpNo.onclick = () => {
  const userDoc = attendeesDbRef.doc(firebase.auth().currentUser.uid);
  userDoc.set({
    attending: false
  }).catch(console.error);
};

// Checa no banco quantas pessoas vão participar e coloca o número na página
attendeesDbRef.where("attending", '==', true).onSnapshot(snap => {
 const newAttendeeCount = snap.docs.length;

 numberAttending.innerHTML = newAttendeeCount+' people going'; 
});

// Verifica se o usuário vai ao evento e adiciona o elemento no botão SIM para aparecer clicado
function subscribeCurrentRSVP(user){
 rsvpListener = attendeesDbRef.doc(user.uid).onSnapshot((doc) => {
   if (doc && doc.data()){
     const attendingResponse = doc.data().attending;

     // Update css classes for buttons
     if (attendingResponse){
       rsvpYes.className="clicked";
       rsvpNo.className="";
     }
     else{
       rsvpYes.className="";
       rsvpNo.className="clicked";
     }
   }
 });
};


// Verifica se o usuário não vai ao evento e adiciona o elemento no botão NÃO para aparecer clicado
function unsubscribeCurrentRSVP(){
 if (rsvpListener != null)
 {
   rsvpListener();
   rsvpListener = null;
 }
 rsvpYes.className="";
 rsvpNo.className="";
};