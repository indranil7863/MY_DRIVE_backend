import { Resend } from "resend";

const resend = new Resend("re_TszUP4pg_N7CVnZ12pB1J1NKZzd7wCzrQ");

export const sendEmail = async(email, otp) =>{
    console.log({email, otp});
    const {data} = await resend.emails.send({
    from: "Storage App <storageApp@storageapp.indranil.shop>",
    to: email,
    subject: "Verify the OTP",
    html: `<h2>${otp}</h2>`
})
    return data;
}