import Razorpay from 'razorpay'

const rzpInstance = new Razorpay({
    key_id: 'rzp_test_SrVKJg8iTsL1ai',
    key_secret: 'JvXlJ11DtypDkT8U6LcON0Gw'
})

export const createOrderId = async (req, res, next) => {
    const { name, price } = req.body;
    console.log({ name, price })

    try {
        const order = await rzpInstance.orders.create({
            amount: price * 100,
            currency: "INR",
            notes: {
                courseName: name
            }
        })

        console.log(order);
        console.log("orderId: ", order.id);
        return res.status(200).json({ orderId: order.id })
    } catch (error) {
        next(error);
        console.log("Error: ", error.message);
    }
}

export const verifyOrder = async (req, res, next) => {
    const { orderId, courseId, courseName, userName, userContact } = req.body;
    try {
        const order = rzpInstance.orders.fetch(orderId);

        if (!order) {
            return res.status(404).json({ error: "Invalid order id" });
        }
        if (order.status === "paid") {
            return res.json({ message: "Order Completed", status: "success" });
        }
        res.status(400).json({ error: "Order not completed", status: "failed" });
    } catch (error) {
        next(error);
        console.log("Error: ", error.message);
    }
}