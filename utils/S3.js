import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import dotenv from 'dotenv'
dotenv.config();

export const s3client = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_KEY_ID
    }
})

export const createUploadSignedUrl = async ({ Key, contentType }) => {
    const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: Key,
        ContentType: contentType
    })
    const url = await getSignedUrl(s3client, command, {
        expiresIn: 300,
        signableHeaders: new Set(["content-type"])
    })

    return url;
}

export const createGetSignedUrl = async ({ key, download = false, filename }) => {
    const command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `${download ? "attachment" : "inline"}; filename=${encodeURIComponent(filename)}`
    })

    const url = await getSignedUrl(s3client, command, {
        expiresIn: 300
    })
    return url;
}

export const deletes3File = async (key) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key
    })

    return await s3client.send(command);
}

export const deletes3Files = async (keys) => {
    console.log(keys);
    const command = new DeleteObjectsCommand({
        Bucket: process.env.BUCKET_NAME,
        Delete: {
            Objects: keys,
            Quiet: false
        }
    })
    return await s3client.send(command);
}

