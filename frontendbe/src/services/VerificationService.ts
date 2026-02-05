import { Platform } from 'react-native';

const getBaseUrl = () => {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8000';
    }
    return 'http://localhost:8000';
};

const BASE_URL = getBaseUrl();

export interface VerificationResult {
    filename: string;
    input_analysis: any;
    reference_search: any;
    verification_result: any;
}

export const VerificationService = {
    async verifyProduct(imageUri: string): Promise<VerificationResult> {
        try {
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'upload.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            if (Platform.OS === 'web') {
                // Determine if it's a data URI or blob URI
                const res = await fetch(imageUri);
                const blob = await res.blob();
                formData.append('file', blob, filename);
            } else {
                // @ts-ignore: React Native FormData requires { uri, name, type }
                formData.append('file', {
                    uri: imageUri,
                    name: filename,
                    type,
                });
            }

            console.log(`Uploading to ${BASE_URL}/verify...`);
            const response = await fetch(`${BASE_URL}/verify`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    // 'Content-Type': 'multipart/form-data', // DO NOT SET THIS MANUALLY! Browser/RN sets boundary.
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Verification Error:', error);
            throw error;
        }
    },

    async checkPrice(imageUri: string, sortBy: string = 'price_asc'): Promise<any> {
        try {
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'upload.jpg';
            const match = /\\.(&#92;w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            if (Platform.OS === 'web') {
                const res = await fetch(imageUri);
                const blob = await res.blob();
                formData.append('file', blob, filename);
            } else {
                // @ts-ignore
                formData.append('file', { uri: imageUri, name: filename, type });
            }

            console.log(`Checking price at ${BASE_URL}/price?sort=${sortBy}...`);
            const response = await fetch(`${BASE_URL}/price?sort=${sortBy}`, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) throw new Error(`Server Error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Price Check Error:', error);
            throw error;
        }
    },

    async getProductDetails(imageUri: string): Promise<any> {
        try {
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'upload.jpg';
            const match = /\\.(&#92;w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            if (Platform.OS === 'web') {
                const res = await fetch(imageUri);
                const blob = await res.blob();
                formData.append('file', blob, filename);
            } else {
                // @ts-ignore
                formData.append('file', { uri: imageUri, name: filename, type });
            }

            console.log(`Getting details at ${BASE_URL}/details...`);
            const response = await fetch(`${BASE_URL}/details`, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' },
            });

            if (!response.ok) throw new Error(`Server Error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Details Error:', error);
            throw error;
        }
    }
};
