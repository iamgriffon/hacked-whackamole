# Whack-a-Mole com TensorFlow.js

Projeto independente baseado no exemplo 02 de `ai-postgrad`. Segue o fluxo do Duck Hunt: captura do tabuleiro → inferência em Web Worker → coordenadas → ação no jogo.

## Executar

Requer Node.js 20 ou superior. Não precisa instalar dependências nem compilar:

```sh
cd /Users/gdupin/code/project/hacked-whackamole
npm start
```

Abra http://localhost:8082 e clique em **Iniciar partida**. A IA vem ativada. Para jogar manualmente, desmarque **IA joga por mim** e clique no buraco ou foque o tabuleiro e use as teclas 1–9, da esquerda para a direita e de cima para baixo. O som é opcional.

É necessária conexão com a internet para carregar TensorFlow.js **4.22.0** do jsDelivr. Se o carregamento falhar, o modo manual continua disponível; recarregue a página para tentar a IA novamente. Use HTTP, não abra o HTML com `file://`.

## GitHub Pages

O GitHub Pages publica os arquivos estáticos a cada push em `main`, sem compilação. Em **Settings → Pages**, a origem é **Deploy from a branch**, branch **main**, pasta **/ (root)**. O arquivo `.nojekyll` desativa o processamento Jekyll. Este repositório é público para permitir Pages no plano atual.

Jogue em: https://iamgriffon.github.io/hacked-whackamole/

O servidor Node é usado apenas no desenvolvimento local. No Pages, o jogo e o worker rodam no navegador; o TensorFlow.js continua sendo carregado pelo CDN.

## O que significa vencer

O original acumula pontos por 30 segundos, sem vitória ou derrota explícita. Aqui, vitória perfeita significa acertar **todas as toupeiras que apareceram**, sem nenhuma perda. Cada acerto vale 10 pontos, cada alvo fica disponível por 1500 ms e o sprite acertado permanece por 500 ms. Não há pontos extras por clicar repetidamente.

A versão usa Canvas em vez de elementos DOM e não reproduz a animação de subida. Não nasce uma nova toupeira nos últimos 1500 ms, garantindo uma janela completa para cada alvo. O relógio termina exatamente em 30 segundos. Reiniciar limpa a partida e invalida inferências anteriores.

## Como a IA vê

- `renderer.js` desenha o tabuleiro e produz três imagens de referência: vazio, toupeira e toupeira acertada.
- `main.js` captura os pixels a cada 50 ms, mantendo no máximo uma inferência em andamento. Não envia a posição nem o estado da toupeira ao worker.
- `machine-learning/worker.js` usa TensorFlow.js no backend CPU, reduz cada célula a 24 × 24 pixels e calcula a distância quadrática média às referências. É **template matching**, não uma rede neural treinada nem um modelo YOLO.
- Apenas uma célula classificada como toupeira e com distância abaixo de 0,001 gera coordenadas. O indicador de correspondência é `1 − distância`, não uma probabilidade calibrada.
- A IA chama a mesma função de acerto do jogador. O jogo valida posição, prazo e estado antes de pontuar. `tf.tidy` libera os tensores temporários; apenas os templates persistem.

Essa estratégia é determinística para os sprites e a renderização fixa deste exemplo. Não promete vencer em qualquer condição: suspensão de aba, atrasos acima de 1500 ms ou mudanças nos sprites podem causar perdas. O relógio não é pausado para ajudar a IA e não existe fallback que consulte a posição do alvo. Não é um bot para controlar a página remota do GitHub Pages.

## Verificação

```sh
npm test
```

Os testes de regras cobrem acertos duplicados, posições erradas, expiração, partida perfeita e reinício. Para verificar a visão, jogue uma partida automática completa e confira zero perdas. Desative a IA para verificar que alvos não acertados são contabilizados como perdas.

## Origem

Jogo e assets de referência: [jahidulislamzim/whack-a-mole](https://github.com/jahidulislamzim/whack-a-mole), commit `80d82d8a7874f83e1a860dfa84e991d03b232211`. Os arquivos `assets/mole.png`, `assets/mole-whacked.png` e `assets/smash.mp3` foram obtidos desse repositório e mantêm sua autoria original. O upstream consultado não contém arquivo de licença; esta adaptação não atribui uma nova licença aos assets.

Referência técnica: [API do TensorFlow.js](https://js.tensorflow.org/api/4.22.0/).
