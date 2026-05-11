// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('documentForm');
    const statusDiv = document.getElementById('status');
    const statusMessage = document.getElementById('statusMessage');

    // Set default date and time to current
    const now = new Date();
    document.getElementById('docDate').valueAsDate = now;
    document.getElementById('docTime').value = now.toTimeString().slice(0, 5);

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submitted!');
        await generateDocument();
    });

    async function generateDocument() {
        console.log('generateDocument called');
        // Get form values
        const formData = {
            docNumber: document.getElementById('docNumber').value,
            docDate: document.getElementById('docDate').value,
            docTime: document.getElementById('docTime').value,
            entryPoint: document.getElementById('entryPoint').value,
            driverName: document.getElementById('driverName').value,
            vehicleNumber: document.getElementById('vehicleNumber').value,
            vehicleProvince: document.getElementById('vehicleProvince').value,
            weight: document.getElementById('weight').value,
            destination: document.getElementById('destination').value,
            companyName: document.getElementById('companyName').value,
            cargoType: document.getElementById('cargoType').value
        };

        // Handle QR code file upload
        const qrFile = document.getElementById('qrFile').files[0];
        if (qrFile) {
            // Convert uploaded image to base64
            const qrBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(qrFile);
            });
            formData.qrImage = qrBase64;
        }

        // Format date (DD-MM-YYYY)
        const dateObj = new Date(formData.docDate);
        formData.docDate = `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;

        // Format time with AM/PM
        const timeParts = formData.docTime.split(':');
        let hours = parseInt(timeParts[0]);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // Convert to 12-hour format
        formData.docTime = `${hours}:${minutes} ${ampm}`;

        // Show loading status
        const submitBtn = document.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'جاري إنشاء PDF...';
        submitBtn.disabled = true;

        showStatus('جاري إنشاء الوثيقة...', 'info');

        try {
            // Send request to backend (works with any domain)
            console.log('Sending data to server:', formData);
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            console.log('Response received:', response);

            if (!response.ok) {
                throw new Error('فشل في إنشاء الوثيقة');
            }

            // Get the PDF/DOCX blob
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Determine file extension from content type
            const contentType = response.headers.get('content-type');
            const extension = contentType.includes('pdf') ? 'pdf' : 'docx';

            a.download = `وثيقة-${formData.docNumber}.${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showStatus('تم إنشاء الوثيقة بنجاح! ✓', 'success');

        } catch (error) {
            console.error('Error generating document:', error);
            console.error('Error stack:', error.stack);
            showStatus(`حدث خطأ: ${error.message}`, 'error');
        } finally {
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusDiv.style.display = 'block';

        // Set colors based on type
        if (type === 'success') {
            statusDiv.style.backgroundColor = '#d4edda';
            statusDiv.style.color = '#155724';
            statusDiv.style.border = '1px solid #c3e6cb';
        } else if (type === 'error') {
            statusDiv.style.backgroundColor = '#f8d7da';
            statusDiv.style.color = '#721c24';
            statusDiv.style.border = '1px solid #f5c6cb';
        } else {
            statusDiv.style.backgroundColor = '#d1ecf1';
            statusDiv.style.color = '#0c5460';
            statusDiv.style.border = '1px solid #bee5eb';
        }

        // Auto-hide after 5 seconds for success/info
        if (type !== 'error') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }
});
