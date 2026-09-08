# MONTECARLO Casino - FIX para GitHub Pages

### Cómo subirlo a GitHub y que FUNCIONE:

1. Creá un repo nuevo en GitHub (ej: montecarlo-casino)

2. Subí estos archivos:
```bash
git init
git add .
git commit -m "casino inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

3. En GitHub, andá a Settings > Pages:
   - Source: GitHub Actions

4. ¡Listo! El workflow .github/workflows/deploy.yml se va a ejecutar solo.
   Tu casino va a estar en: https://TU_USUARIO.github.io/TU_REPO/

### Si lo querés probar local:
```
npm install
npm run dev
```

### Si te da pantalla en blanco:
Ya está arreglado con `base: './'` en vite.config.js. Antes fallaba por eso.

### Si usas gh-pages manual:
```
npm run build
npm run deploy
```
