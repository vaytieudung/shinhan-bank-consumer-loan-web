document.addEventListener('DOMContentLoaded', () => {
    class EkycApp {
        constructor() {
            this.config = {
                AUTO_CAPTURE_INTERVAL: 500,
                MAX_CAPTURE_TIMEOUT: 30000,
                ERROR_MESSAGE_TIMEOUT: 5000,
                FACE_AUTO_CAPTURE_DELAY: 1500,
                LIVENESS_ACTION_DURATION: 2000,
                LIVENESS_COOLDOWN_DURATION: 1000,
                FACE_DETECTION_INTERVAL: 100,
                MAX_LIVENESS_ATTEMPTS: 3,
                CARD_ASPECT_RATIO: 1.58,
                CARD_DETECTION_THRESHOLD: 0.05,
                CARD_SIZE_MIN_PERCENT: 0.4,
                CARD_SIZE_MAX_PERCENT: 0.8,
            };
            this.initLanguage();
            this.cacheDOMElements();
            this.initState();
            this.initEventListeners();
            this.updateUIWithLanguage();
            this.initLibs();
        }

        // Language Management
        initLanguage() {
            this.languages = {
                vi: {
                    stepper_step1: "Bước 1/4: Chọn loại giấy tờ",
                    stepper_step2: "Bước 2/4: Chụp ảnh giấy tờ",
                    stepper_step3: "Bước 3/4: Xác nhận thông tin",
                    stepper_step4: "Bước 4/4: Xác thực khuôn mặt",
                    loading_resources: "Đang tải tài nguyên...",
                    success_title: "Xác thực thành công!",
                    success_subtitle: "Cảm ơn bạn đã hoàn tất quá trình xác thực eKYC.",
                    docselect_title: "Xác thực giấy tờ",
                    docselect_subtitle: "Chọn một trong các phương thức xác thực dưới đây",
                    capture_front_title: "Chụp mặt trước",
                    capture_back_title: "Chụp mặt sau",
                    capture_instruction_front: "Đưa mặt trước giấy tờ vào khung hình",
                    capture_instruction_back: "Đưa mặt sau giấy tờ vào khung hình",
                    confirm_info_title: "Xác nhận thông tin",
                    confirm_info_subtitle: "Vui lòng kiểm tra kỹ hình ảnh và thông tin.",
                    face_liveness_title: "Xác thực khuôn mặt",
                    face_liveness_subtitle: "Vui lòng giữ khuôn mặt trong khung hình oval.",
                    error_no_face: "Không phát hiện khuôn mặt. Vui lòng thử lại.",
                    error_blurry_image: "Ảnh bị mờ. Vui lòng chụp lại.",
                    error_no_document: "Không phát hiện giấy tờ. Vui lòng thử lại.",
                    error_capture_timeout: "Không thể chụp ảnh. Vui lòng thử lại.",
                },
                en: {
                    stepper_step1: "Step 1/4: Select document type",
                    stepper_step2: "Step 2/4: Capture document photos",
                    stepper_step3: "Step 3/4: Confirm information",
                    stepper_step4: "Step 4/4: Face verification",
                    loading_resources: "Loading resources...",
                    success_title: "Verification successful!",
                    success_subtitle: "Thank you for completing the eKYC process.",
                    docselect_title: "Document Verification",
                    docselect_subtitle: "Choose one of the verification methods below",
                    capture_front_title: "Capture front side",
                    capture_back_title: "Capture back side",
                    capture_instruction_front: "Place the front side inside the frame",
                    capture_instruction_back: "Place the back side inside the frame",
                    confirm_info_title: "Confirm information",
                    confirm_info_subtitle: "Please check the images and information carefully.",
                    face_liveness_title: "Face verification",
                    face_liveness_subtitle: "Please keep your face inside the oval frame.",
                    error_no_face: "No face detected. Please try again.",
                    error_blurry_image: "Image is blurry. Please retake.",
                    error_no_document: "No document detected. Please try again.",
                    error_capture_timeout: "Unable to capture image. Please try again.",
                }
            };
            this.currentLang = 'vi';
        }

        toggleLanguage() {
            this.currentLang = this.currentLang === 'vi' ? 'en' : 'vi';
            this.dom.btnLang.textContent = this.currentLang === 'vi' ? 'EN' : 'VI';
            this.updateUIWithLanguage();
        }

        updateUIWithLanguage() {
            document.querySelectorAll('[data-lang-key]').forEach(el => {
                const key = el.getAttribute('data-lang-key');
                if (this.languages[this.currentLang][key]) {
                    el.textContent = this.languages[this.currentLang][key];
                }
            });
            this.updateStepper(this.languages[this.currentLang].stepper_step1);
        }

        updateStepper(text) {
            if (this.dom.stepper) {
                this.dom.stepper.textContent = text;
            }
        }

        // DOM Elements Caching
        cacheDOMElements() {
            this.dom = {
                viewContainer: document.getElementById('viewContainer'),
                stepper: document.getElementById('stepper'),
                btnLang: document.getElementById('btnLang'),
                
                docSelectView: document.getElementById('docSelectView'),
                captureView: document.getElementById('captureView'),
                confirmView: document.getElementById('confirmView'),
                videoTutorialView: document.getElementById('videoTutorialView'),
                faceCaptureView: document.getElementById('faceCaptureView'),
                successView: document.getElementById('successView'),
                qrScannerModal: document.getElementById('qrScannerModal'),
                
                docOptions: document.querySelectorAll('.doc-option'),
                
                cameraVideo: document.getElementById('cameraVideo'),
                cameraCanvas: document.getElementById('cameraCanvas'),
                detectionCanvas: document.getElementById('detectionCanvas'),
                cameraFrame: document.getElementById('cameraFrame'),
                cameraOverlay: document.getElementById('cameraOverlay'),
                
                faceCameraVideo: document.getElementById('faceCameraVideo'),
                faceCameraCanvas: document.getElementById('faceCameraCanvas'),
                
                qrVideo: document.getElementById('qrVideo'),
                qrMessage: document.getElementById('qrMessage'),
                
                btnCapture: document.getElementById('btnCapture'),
                btnBack: document.getElementById('btnBack'),
                btnUpload: document.getElementById('btnUpload'),
                btnConfirmInfo: document.getElementById('btnConfirmInfo'),
                btnStartFaceCapture: document.getElementById('btnStartFaceCapture'),
                btnConfirmLiveness: document.getElementById('btnConfirmLiveness'),
                btnFinalConfirm: document.getElementById('btnFinalConfirm'),
                btnCancelQR: document.getElementById('btnCancelQR'),
                
                captureTitle: document.getElementById('captureTitle'),
                captureSubtitle: document.getElementById('captureSubtitle'),
                captureInstruction: document.getElementById('captureInstruction'),
                faceCaptureTitle: document.getElementById('faceCaptureTitle'),
                faceCaptureSubtitle: document.getElementById('faceCaptureSubtitle'),
                faceCaptureInstruction: document.getElementById('faceCaptureInstruction'),
                
                confirmFrontImg: document.getElementById('confirmFrontImg'),
                confirmBackImg: document.getElementById('confirmBackImg'),
                confirmBackItem: document.getElementById('confirmBackItem'),
                infoIdNumber: document.getElementById('infoIdNumber'),
                infoFullName: document.getElementById('infoFullName'),
                infoDob: document.getElementById('infoDob'),
                
                errorMessage: document.getElementById('errorMessage'),
                loadingOverlay: document.getElementById('loadingOverlay'),
                
                cccdGuideModal: document.getElementById('cccdGuideModal'),
                passportGuideModal: document.getElementById('passportGuideModal'),
                driverLicenseGuideModal: document.getElementById('driverLicenseGuideModal'),
                fullscreenModal: document.getElementById('fullscreenModal'),
                fullscreenImage: document.getElementById('fullscreenImage'),
                
                livenessSteps: document.querySelectorAll('.liveness-step'),
                lottieProcessing: document.getElementById('lottieProcessing'),
                lottieSuccess: document.getElementById('lottieSuccess'),
                lottieLoading: document.getElementById('lottieLoading'),
                
                imageUpload: document.getElementById('imageUpload'),
                tutorialVideo: document.getElementById('tutorialVideo')
            };
        }

        // State Management
        initState() {
            this.state = {
                currentView: 'docSelectView',
                selectedDocType: null,
                captureStep: 'front',
                capturedImages: { front: null, back: null },
                extractedInfo: { idNumber: '', fullName: '', dateOfBirth: '' },
                cameraStream: null,
                faceCameraStream: null,
                qrStream: null,
                isCapturing: false,
                livenessStep: 0,
                livenessCompleted: false,
                faceDetectionInterval: null,
                captureTimeout: null
            };
        }

        // Event Listeners
        initEventListeners() {
            if (this.dom.btnLang) {
                this.dom.btnLang.addEventListener('click', () => this.toggleLanguage());
            }

            this.dom.docOptions.forEach(option => {
                option.addEventListener('click', (e) => this.handleDocumentSelection(e));
            });

            if (this.dom.btnCapture) {
                this.dom.btnCapture.addEventListener('click', () => this.capturePhoto());
            }
            
            if (this.dom.btnBack) {
                this.dom.btnBack.addEventListener('click', () => this.goBack());
            }

            if (this.dom.btnUpload) {
                this.dom.btnUpload.addEventListener('click', () => this.dom.imageUpload?.click());
            }

            if (this.dom.imageUpload) {
                this.dom.imageUpload.addEventListener('change', (e) => this.handleFileUpload(e));
            }

            if (this.dom.btnConfirmInfo) {
                this.dom.btnConfirmInfo.addEventListener('click', () => this.showVideoTutorial());
            }

            if (this.dom.btnStartFaceCapture) {
                this.dom.btnStartFaceCapture.addEventListener('click', () => this.startFaceCapture());
            }

            if (this.dom.btnConfirmLiveness) {
                this.dom.btnConfirmLiveness.addEventListener('click', () => this.showSuccess());
            }

            if (this.dom.btnFinalConfirm) {
                this.dom.btnFinalConfirm.addEventListener('click', () => this.finalConfirm());
            }

            if (this.dom.btnCancelQR) {
                this.dom.btnCancelQR.addEventListener('click', () => this.cancelQRScan());
            }

            document.querySelectorAll('.btn-proceed').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleModalProceed(e));
            });

            document.querySelectorAll('[data-retake]').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleRetake(e));
            });

            document.querySelectorAll('.confirm-item img').forEach(img => {
                img.addEventListener('click', (e) => this.showFullscreenImage(e));
            });

            document.addEventListener('keydown', (e) => this.handleKeydown(e));
        }

        // Library Initialization
        async initLibs() {
            try {
                this.showLoading(this.languages[this.currentLang].loading_resources);
                
                if (typeof lottie !== 'undefined') {
                    this.initLottieAnimations();
                }

                if (typeof faceapi !== 'undefined') {
                    await this.initFaceAPI();
                }

                this.hideLoading();
            } catch (error) {
                console.error('Error initializing libraries:', error);
                this.hideLoading();
            }
        }

        initLottieAnimations() {
            if (this.dom.lottieLoading) {
                this.loadingAnimation = lottie.loadAnimation({
                    container: this.dom.lottieLoading,
                    renderer: 'svg',
                    loop: true,
                    autoplay: false,
                    path: 'https://assets2.lottiefiles.com/packages/lf20_szlepvdj.json'
                });
            }

            if (this.dom.lottieSuccess) {
                this.successAnimation = lottie.loadAnimation({
                    container: this.dom.lottieSuccess,
                    renderer: 'svg',
                    loop: false,
                    autoplay: false,
                    path: 'https://assets9.lottiefiles.com/packages/lf20_jbrw3hcz.json'
                });
            }

            if (this.dom.lottieProcessing) {
                this.processingAnimation = lottie.loadAnimation({
                    container: this.dom.lottieProcessing,
                    renderer: 'svg',
                    loop: true,
                    autoplay: false,
                    path: 'https://assets4.lottiefiles.com/packages/lf20_a2chheio.json'
                });
            }
        }

        async initFaceAPI() {
            try {
                const MODEL_URL = 'https://vaytieudung.github.io/shinhanbank/web-sdk-version-3.2.0.0/models';
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
            } catch (error) {
                console.error('Face API initialization failed:', error);
            }
        }

        // Document Selection
        handleDocumentSelection(e) {
            const docType = e.currentTarget.dataset.type;
            this.state.selectedDocType = docType;

            switch (docType) {
                case 'cccd':
                    this.showModal('cccdGuideModal');
                    break;
                case 'passport':
                    this.showModal('passportGuideModal');
                    break;
                case 'driver':
                    this.showModal('driverLicenseGuideModal');
                    break;
                case 'qr':
                    this.startQRScan();
                    break;
                case 'other':
                    this.showModal('cccdGuideModal');
                    break;
                default:
                    this.showModal('cccdGuideModal');
            }
        }

        // Modal Management
        showModal(modalId) {
            const modal = this.dom[modalId];
            if (modal) {
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
            }
        }

        hideModal(modalId) {
            const modal = this.dom[modalId];
            if (modal) {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }
        }

        handleModalProceed(e) {
            ['cccdGuideModal', 'passportGuideModal', 'driverLicenseGuideModal'].forEach(modalId => {
                this.hideModal(modalId);
            });
            this.startCapture();
        }

        // View Management
        showView(viewName) {
            Object.keys(this.dom).forEach(key => {
                if (key.endsWith('View') && this.dom[key]) {
                    this.dom[key].classList.add('hidden');
                }
            });

            if (this.dom[viewName]) {
                this.dom[viewName].classList.remove('hidden');
                this.state.currentView = viewName;
            }
        }

        // Camera Management
        async startCapture() {
            this.showView('captureView');
            this.state.captureStep = 'front';
            this.updateCaptureUI();
            this.updateStepper(this.languages[this.currentLang].stepper_step2);
            
            try {
                await this.initCamera();
            } catch (error) {
                console.error('Camera initialization failed:', error);
                this.showError(this.languages[this.currentLang].error_capture_timeout);
            }
        }

        async initCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'environment'
                    }
                });

                this.state.cameraStream = stream;
                if (this.dom.cameraVideo) {
                    this.dom.cameraVideo.srcObject = stream;
                    await this.dom.cameraVideo.play();
                }

                this.startDocumentDetection();
            } catch (error) {
                console.error('Camera access failed:', error);
                throw error;
            }
        }

        startDocumentDetection() {
            if (this.state.cameraStream && this.dom.cameraVideo) {
                this.state.captureTimeout = setInterval(() => {
                    this.detectDocument();
                }, this.config.AUTO_CAPTURE_INTERVAL);
            }
        }

        detectDocument() {
            const isDocumentDetected = Math.random() > 0.7;
            
            if (isDocumentDetected) {
                this.dom.cameraFrame?.classList.add('ready-to-capture');
                this.updateCaptureInstruction('Giấy tờ được phát hiện - Nhấn chụp ảnh');
            } else {
                this.dom.cameraFrame?.classList.remove('ready-to-capture');
                this.updateCaptureInstruction(
                    this.state.captureStep === 'front' 
                        ? this.languages[this.currentLang].capture_instruction_front
                        : this.languages[this.currentLang].capture_instruction_back
                );
            }
        }

        updateCaptureUI() {
            const isBack = this.state.captureStep === 'back';
            
            if (this.dom.captureTitle) {
                this.dom.captureTitle.textContent = isBack 
                    ? this.languages[this.currentLang].capture_back_title
                    : this.languages[this.currentLang].capture_front_title;
            }

            if (this.dom.captureSubtitle) {
                this.dom.captureSubtitle.textContent = isBack
                    ? 'Chụp mặt sau của giấy tờ'
                    : 'Chụp mặt trước của giấy tờ';
            }

            this.updateCaptureInstruction(
                isBack 
                    ? this.languages[this.currentLang].capture_instruction_back
                    : this.languages[this.currentLang].capture_instruction_front
            );
        }

        updateCaptureInstruction(text) {
            if (this.dom.captureInstruction) {
                this.dom.captureInstruction.textContent = text;
            }
        }

        async capturePhoto() {
            if (!this.state.cameraStream || this.state.isCapturing) return;

            this.state.isCapturing = true;
            
            try {
                const canvas = this.dom.cameraCanvas;
                const video = this.dom.cameraVideo;
                
                if (canvas && video) {
                    const ctx = canvas.getContext('2d');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    ctx.drawImage(video, 0, 0);
                    
                    const imageData = canvas.toDataURL('image/jpeg', 0.8);
                    this.state.capturedImages[this.state.captureStep] = imageData;

                    this.dom.cameraFrame?.classList.add('blink-once');
                    setTimeout(() => {
                        this.dom.cameraFrame?.classList.remove('blink-once');
                    }, 500);

                    await this.processImage(imageData);
                }
            } catch (error) {
                console.error('Capture failed:', error);
                this.showError(this.languages[this.currentLang].error_capture_timeout);
            } finally {
                this.state.isCapturing = false;
            }
        }

        async processImage(imageData) {
            this.showLoading('Đang xử lý ảnh...');
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (this.state.captureStep === 'front') {
                this.state.extractedInfo = {
                    idNumber: '123456789012',
                    fullName: 'NGUYỄN VĂN A',
                    dateOfBirth: '01/01/1990'
                };
            }

            this.hideLoading();

            if (this.state.captureStep === 'front' && this.needsBackCapture()) {
                this.state.captureStep = 'back';
                this.updateCaptureUI();
            } else {
                this.stopCamera();
                this.showConfirmation();
            }
        }

        needsBackCapture() {
            return ['cccd', 'other'].includes(this.state.selectedDocType);
        }

        stopCamera() {
            if (this.state.cameraStream) {
                this.state.cameraStream.getTracks().forEach(track => track.stop());
                this.state.cameraStream = null;
            }
            
            if (this.state.captureTimeout) {
                clearInterval(this.state.captureTimeout);
                this.state.captureTimeout = null;
            }
        }

        // File Upload
        handleFileUpload(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target.result;
                    this.state.capturedImages[this.state.captureStep] = imageData;
                    this.processImage(imageData);
                };
                reader.readAsDataURL(file);
            }
        }

        // Confirmation View
        showConfirmation() {
            this.showView('confirmView');
            this.updateStepper(this.languages[this.currentLang].stepper_step3);
            
            if (this.dom.confirmFrontImg && this.state.capturedImages.front) {
                this.dom.confirmFrontImg.src = this.state.capturedImages.front;
            }
            
            if (this.dom.confirmBackImg && this.state.capturedImages.back) {
                this.dom.confirmBackImg.src = this.state.capturedImages.back;
            } else if (this.dom.confirmBackItem && !this.needsBackCapture()) {
                this.dom.confirmBackItem.style.display = 'none';
            }

            this.updateExtractedInfo();
        }

        updateExtractedInfo() {
            if (this.dom.infoIdNumber) {
                this.dom.infoIdNumber.textContent = this.state.extractedInfo.idNumber || 'Đang xử lý...';
            }
            if (this.dom.infoFullName) {
                this.dom.infoFullName.textContent = this.state.extractedInfo.fullName || 'Đang xử lý...';
            }
            if (this.dom.infoDob) {
                this.dom.infoDob.textContent = this.state.extractedInfo.dateOfBirth || 'Đang xử lý...';
            }
        }

        // Video Tutorial
        showVideoTutorial() {
            this.showView('videoTutorialView');
            this.updateStepper(this.languages[this.currentLang].stepper_step4);
            
            if (this.dom.tutorialVideo) {
                this.dom.tutorialVideo.play().catch(console.error);
            }
        }

        // Face Capture and Liveness
        async startFaceCapture() {
            this.showView('faceCaptureView');
            this.state.livenessStep = 0;
            this.state.livenessCompleted = false;
            
            try {
                await this.initFaceCamera();
                this.startLivenessCheck();
            } catch (error) {
                console.error('Face camera initialization failed:', error);
                this.showError(this.languages[this.currentLang].error_no_face);
            }
        }

        async initFaceCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'user'
                    }
                });

                this.state.faceCameraStream = stream;
                if (this.dom.faceCameraVideo) {
                    this.dom.faceCameraVideo.srcObject = stream;
                    await this.dom.faceCameraVideo.play();
                }
            } catch (error) {
                console.error('Face camera access failed:', error);
                throw error;
            }
        }

        startLivenessCheck() {
            this.updateLivenessStep(0);
            
            const steps = ['straight', 'smile', 'right', 'left'];
            let currentStep = 0;

            const nextStep = () => {
                if (currentStep < steps.length) {
                    this.updateLivenessStep(currentStep);
                    currentStep++;
                    setTimeout(nextStep, this.config.LIVENESS_ACTION_DURATION);
                } else {
                    this.completeLivenessCheck();
                }
            };

            setTimeout(nextStep, 1000);
        }

        updateLivenessStep(stepIndex) {
            this.dom.livenessSteps.forEach((step, index) => {
                step.classList.remove('active', 'completed', 'error');
                
                if (index < stepIndex) {
                    step.classList.add('completed');
                } else if (index === stepIndex) {
                    step.classList.add('active');
                }
            });

            const instructions = [
                'Nhìn thẳng vào camera',
                'Vui lòng mỉm cười',
                'Quay mặt sang phải',
                'Quay mặt sang trái',
                'Xác thực thành công!'
            ];

            if (this.dom.faceCaptureInstruction && instructions[stepIndex]) {
                this.dom.faceCaptureInstruction.textContent = instructions[stepIndex];
            }
        }

        completeLivenessCheck() {
            this.state.livenessCompleted = true;
            this.updateLivenessStep(4);
            
            if (this.dom.btnConfirmLiveness) {
                this.dom.btnConfirmLiveness.disabled = false;
            }

            if (this.state.faceCameraStream) {
                this.state.faceCameraStream.getTracks().forEach(track => track.stop());
                this.state.faceCameraStream = null;
            }
        }

        // Success View
        showSuccess() {
            this.showView('successView');
            
            if (this.successAnimation) {
                this.successAnimation.play();
            }
        }

        // QR Scanner
        async startQRScan() {
            this.showView('qrScannerModal');
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640 },
                        height: { ideal: 480 },
                        facingMode: 'environment'
                    }
                });

                this.state.qrStream = stream;
                if (this.dom.qrVideo) {
                    this.dom.qrVideo.srcObject = stream;
                    await this.dom.qrVideo.play();
                }

                this.startQRDetection();
            } catch (error) {
                console.error('QR camera access failed:', error);
                this.cancelQRScan();
            }
        }

        startQRDetection() {
            const detectQR = () => {
                if (this.state.qrStream && this.dom.qrVideo) {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = this.dom.qrVideo.videoWidth;
                    canvas.height = this.dom.qrVideo.videoHeight;
                    ctx.drawImage(this.dom.qrVideo, 0, 0);
                    
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    
                    if (typeof jsQR !== 'undefined') {
                        const code = jsQR(imageData.data, imageData.width, imageData.height);
                        if (code) {
                            this.handleQRDetected(code.data);
                            return;
                        }
                    }
                    
                    requestAnimationFrame(detectQR);
                }
            };
            
            detectQR();
        }

        handleQRDetected(qrData) {
            console.log('QR Code detected:', qrData);
            this.cancelQRScan();
            
            this.state.extractedInfo = {
                idNumber: 'QR-' + Date.now(),
                fullName: 'QR User',
                dateOfBirth: '01/01/1990'
            };
            
            this.showConfirmation();
        }

        cancelQRScan() {
            if (this.state.qrStream) {
                this.state.qrStream.getTracks().forEach(track => track.stop());
                this.state.qrStream = null;
            }
            
            this.showView('docSelectView');
        }

        // Navigation
        goBack() {
            switch (this.state.currentView) {
                case 'captureView':
                    this.stopCamera();
                    this.showView('docSelectView');
                    this.updateStepper(this.languages[this.currentLang].stepper_step1);
                    break;
                case 'confirmView':
                    this.startCapture();
                    break;
                case 'faceCaptureView':
                    this.showView('videoTutorialView');
                    break;
                default:
                    this.showView('docSelectView');
                    this.updateStepper(this.languages[this.currentLang].stepper_step1);
            }
        }

        // Retake functionality
        handleRetake(e) {
            const retakeType = e.currentTarget.dataset.retake;
            this.state.captureStep = retakeType;
            this.startCapture();
        }

        // Fullscreen image
        showFullscreenImage(e) {
            const imgSrc = e.currentTarget.src;
            if (this.dom.fullscreenModal && this.dom.fullscreenImage) {
                this.dom.fullscreenImage.src = imgSrc;
                this.dom.fullscreenModal.classList.remove('hidden');
            }
        }

        // Keyboard handling
        handleKeydown(e) {
            if (e.key === 'Escape') {
                if (this.dom.fullscreenModal && !this.dom.fullscreenModal.classList.contains('hidden')) {
                    this.dom.fullscreenModal.classList.add('hidden');
                }
                
                ['cccdGuideModal', 'passportGuideModal', 'driverLicenseGuideModal'].forEach(modalId => {
                    this.hideModal(modalId);
                });
            }
        }

        // Loading and Error handling
        showLoading(message) {
            if (this.dom.loadingOverlay) {
                this.dom.loadingOverlay.classList.remove('hidden');
                const loadingText = this.dom.loadingOverlay.querySelector('.loading-text');
                if (loadingText) {
                    loadingText.textContent = message;
                }
                if (this.loadingAnimation) {
                    this.loadingAnimation.play();
                }
            }
        }

        hideLoading() {
            if (this.dom.loadingOverlay) {
                this.dom.loadingOverlay.classList.add('hidden');
                if (this.loadingAnimation) {
                    this.loadingAnimation.stop();
                }
            }
        }

        showError(message) {
            if (this.dom.errorMessage) {
                this.dom.errorMessage.textContent = message;
                this.dom.errorMessage.classList.add('visible');
                
                setTimeout(() => {
                    this.dom.errorMessage.classList.remove('visible');
                }, this.config.ERROR_MESSAGE_TIMEOUT);
            }
        }

        // Final confirmation
        finalConfirm() {
            this.showLoading('Đang gửi thông tin...');
            
            setTimeout(() => {
                this.hideLoading();
                alert('Xác thực eKYC hoàn tất thành công!');
                // Reset to initial state
                this.showView('docSelectView');
                this.updateStepper(this.languages[this.currentLang].stepper_step1);
                this.initState();
            }, 2000);
        }
    }

    // Initialize the application
    new EkycApp();
});
