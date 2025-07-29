# VNPT eKYC - Standalone Application

A modern, standalone Next.js implementation of the VNPT eKYC (electronic Know Your Customer) system for Vietnamese identity verification.

## 🚀 Features

- **Document Verification**: Support for multiple Vietnamese identity documents
  - Chứng minh thư (ID Card)
  - Thẻ căn cước (Citizen ID Card)
  - Hộ chiếu (Passport)
  - Bằng lái xe (Driver's License)
  - QR Code scanning
  - Other documents

- **Face Recognition & Liveness Detection**: Advanced biometric verification
  - Real-time face capture
  - Liveness detection with multiple steps
  - Face matching with document photos

- **Modern UI/UX**: Clean, responsive design
  - Vietnamese language support
  - Mobile-first responsive design
  - Smooth animations and transitions
  - Progress tracking stepper

- **Camera Integration**: Real-time document and face capture
  - Front/back document scanning
  - Live camera preview with overlay guides
  - Image quality validation

## 🛠️ Technology Stack

- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **UI Components**: ShadCN UI components
- **Fonts**: Inter (Google Fonts)
- **Icons**: Emoji-based (no external icon libraries)

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Modern web browser with camera access

## 🚀 Getting Started

### 1. Clone or Download the Project

```bash
# If you have the project files, navigate to the directory
cd vnpt-ekyc-app
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

### 4. Open in Browser

Open [http://localhost:8000](http://localhost:8000) in your browser to see the application.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── globals.css          # Global Tailwind CSS styles
│   ├── vnpt-ekyc.css       # VNPT eKYC specific styles
│   ├── layout.tsx          # Root layout component
│   └── page.tsx            # Main VNPT eKYC application
├── components/
│   └── ui/                 # ShadCN UI components
├── hooks/
│   └── use-mobile.ts       # Mobile detection hook
└── lib/
    └── utils.ts            # Utility functions
```

## 🎯 Usage Flow

1. **Document Selection**: Choose your identity document type
2. **Document Capture**: 
   - Capture front side of document
   - Capture back side (for CCCD/ID cards)
3. **Face Verification Tutorial**: Watch instructional video
4. **Liveness Detection**: Complete face verification steps
   - Look straight
   - Smile
   - Turn right
   - Turn left
5. **Review Information**: Verify captured images and extracted data
6. **Completion**: Successful verification confirmation

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file for any environment-specific configurations:

```env
# Add any API keys or configuration here
NEXT_PUBLIC_API_URL=your_api_endpoint
```

### Customization

- **Styling**: Modify `src/app/vnpt-ekyc.css` for custom styles
- **Colors**: Update CSS custom properties in the `:root` section
- **Text Content**: Edit Vietnamese text directly in `src/app/page.tsx`
- **Logo**: Replace favicon in `public/favicon.ico`

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices:
- Touch-friendly interface
- Camera access on mobile browsers
- Responsive layouts for all screen sizes
- Optimized for Vietnamese mobile users

## 🔒 Security Features

- Client-side image processing
- No external image uploads during development
- Secure camera access handling
- Privacy-focused design

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy Options

- **Vercel**: Automatic deployment with Git integration
- **Netlify**: Static site deployment
- **Docker**: Containerized deployment
- **Traditional hosting**: Build and serve static files

## 🛠️ Development

### Adding New Features

1. **New Document Types**: Add to the `handleDocTypeSelect` function
2. **Additional Languages**: Extend the language switcher functionality
3. **API Integration**: Add backend API calls for real OCR/face recognition
4. **Enhanced Validation**: Implement document validation logic

### Code Structure

- **State Management**: React hooks for local state
- **Component Architecture**: Functional components with TypeScript
- **Styling**: Utility-first CSS with Tailwind + custom styles
- **Responsive Design**: Mobile-first approach

## 🐛 Troubleshooting

### Common Issues

1. **Camera Access Denied**
   - Ensure HTTPS in production
   - Check browser permissions
   - Test on different devices

2. **Build Errors**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

3. **Styling Issues**
   - Check Tailwind CSS configuration
   - Verify custom CSS imports

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- **Hotline**: 1800 1166 (as displayed in the app)
- **Email**: Create an issue in the repository
- **Documentation**: Check this README and code comments

## 🎉 Acknowledgments

- VNPT for the original eKYC system design
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first CSS framework
- ShadCN for the beautiful UI components

---

**Note**: This is a standalone implementation for demonstration and development purposes. For production use with real identity verification, integrate with appropriate backend services and ensure compliance with Vietnamese data protection regulations.
