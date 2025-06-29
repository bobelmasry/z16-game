# Z16 Game Deployment Script
Write-Host "Building Z16 Game for deployment..." -ForegroundColor Green

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
yarn install

# Build the project
Write-Host "Building project..." -ForegroundColor Yellow
yarn build

Write-Host "Build completed! Files are in the 'out' directory." -ForegroundColor Green
Write-Host "You can now deploy these files to any static hosting service." -ForegroundColor Cyan
Write-Host ""
Write-Host "Deployment options:" -ForegroundColor White
Write-Host "1. Vercel: https://vercel.com" -ForegroundColor Blue
Write-Host "2. Netlify: https://netlify.com" -ForegroundColor Blue
Write-Host "3. GitHub Pages: Push to main branch (auto-deploy)" -ForegroundColor Blue 