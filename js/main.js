/* =====================================================
   main.js — PONTO DE PARTIDA
   É o primeiro código que "faz algo": carrega as imagens
   e, quando tudo estiver pronto, liga o menu.
   ===================================================== */

window.addEventListener("load", () => {
  UI.iniciar();                      // pega os elementos do HTML
  Toque.iniciar();                   // joystick virtual e tela cheia no celular
  Som.iniciar();                     // prepara o áudio (só toca depois do primeiro clique)
  Assets.carregar(() => {            // carrega todos os PNG...
    Menu.iniciar();                  // ...e só então o menu começa a funcionar
    console.log("DG Fantasy pronto!");
  });
});
