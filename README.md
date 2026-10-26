# Clareira de outono

Cena Three.js com uma clareira e a raposa low poly do Sketchfab. O modelo entra na cena pelo `GLTFLoader` e traz três ações no mesmo esqueleto: Survey (observar), Walk (caminhar) e Run (correr).

## Rodar

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar. As teclas `1`, `2` e `3` trocam a ação, com o mesmo efeito dos botões.

## Assets

- Raposa: [Low poly fox by PixelMannen (Animated)](https://sketchfab.com/3d-models/low-poly-fox-by-pixelmannen-animated-371dea88d7e04a76af5763f2a36866bc), de tomkranis. O arquivo `public/models/Fox.glb` é a conversão glTF oficial desse modelo (Khronos). Modelo CC0 (PixelMannen); rig e animações CC BY 4.0 (tomkranis); conversão glTF CC BY 4.0 (Asobo Studio e scurest).
- Céu: [Autumn Meadow](https://polyhaven.com/a/autumn_meadow), de Sergej Majboroda, Poly Haven, CC0. Arquivo `public/hdri/autumn_meadow_1k.hdr`.

O chão, o caminho, as árvores, as pedras e os cogumelos são geometrias criadas no código. A raposa é escalada para cerca de 0,9 m de altura, no caminho de raio 8 m.
