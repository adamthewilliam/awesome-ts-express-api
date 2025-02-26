import { Worker, Queue, Job, WorkerOptions } from 'bullmq';
import Redis from 'ioredis';

interface EmailJobData {
    to: string;
    subject: string;
    body: string;
}

interface ImageProcessingJobData {
    imageUrl: string;
    processingOptions?: {
        resize?: boolean;
        width?: number;
        height?: number;
    };
}

type JobData = EmailJobData | ImageProcessingJobData;

interface RedisConfig {
    host: string;
    port: number;
    password?: string;
}

const getRedisConfig = (): RedisConfig => ({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined
});

const redisConnection = new Redis(getRedisConfig());

const processJob = async (job: Job<JobData>) => {
    try {
        console.log(`Processing job ${job.id} of type ${job.name}`);

        switch (job.name) {
            case 'email-queue':
                await processEmailJob(job.data as EmailJobData);
                break;
            case 'image-processing':
                await processImageJob(job.data as ImageProcessingJobData);
                break;
            default:
                throw new Error(`Unknown job type: ${job.name}`);
        }
    } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error;
    }
};

const processEmailJob = async (data: EmailJobData) => {
    console.log('Sending email:', data);
    // Use a service like SendGrid, Nodemailer, etc.
    // Example: await sendEmail(data.to, data.subject, data.body);
};

const processImageJob = async (data: ImageProcessingJobData) => {
    console.log('Processing image:', data);
    // Use image processing libraries like Sharp
    // Example: await processImage(data.imageUrl, data.processingOptions);
};

const createWorker = (
    queueName: string,
    processorFn: (job: Job<JobData>) => Promise<void>,
    options?: Partial<WorkerOptions>
): Worker => {
    const defaultOptions: WorkerOptions = {
        connection: redisConnection,
        concurrency: 5,
        lockDuration: 30000
    };

    const workerOptions = { ...defaultOptions, ...options };

    const worker = new Worker(queueName, processorFn, workerOptions);

    worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed with error:`, err);
    });

    worker.on('completed', (job) => {
        console.log(`Job ${job?.id} completed successfully`);
    });

    return worker;
};

const createWorkers = (): Worker[] => {
    return [
        createWorker('email-queue', processJob, { concurrency: 5 }),
        createWorker('image-processing', processJob, {
            concurrency: 3,
            lockDuration: 60000 // 1 minute lock for potentially longer jobs
        })
    ];
};

const initializeWorkers = async (): Promise<void> => {
    try {
        console.log('Initializing BullMQ Workers...');
        const workers = createWorkers();
        console.log('BullMQ Workers initialized successfully');

        const shutdown = async () => {
            console.log('Shutting down workers...');
            try {
                await Promise.all(workers.map(worker => worker.close()));
                await redisConnection.quit();
                process.exit(0);
            } catch (error) {
                console.error('Error during shutdown:', error);
                process.exit(1);
            }
        };

        // Handle process termination signals
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    } catch (error) {
        console.error('Failed to initialize workers:', error);
        process.exit(1);
    }
};

initializeWorkers().catch(console.error);