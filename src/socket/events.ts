import { Server, Socket } from 'socket.io';
import { AuthSocket } from './middleware';

export const registerSocketEvents = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        const authSocket = socket as AuthSocket;
        console.log(`User connected: ${authSocket.user?.username} (${socket.id})`);

        socket.on('join_conversation', (conversationId: string) => {
            socket.join(conversationId);
            console.log(`User ${authSocket.user?.username} joined conversation ${conversationId}`);
        });

        socket.on('send_message', (data: { conversationId: string; content: string }) => {
            // In a real app, you'd save to DB here via service
            // const message = await chatService.addMessage(...)

            // Broadcast to room
            io.to(data.conversationId).emit('new_message', {
                sender: authSocket.user?.username,
                content: data.content,
                timestamp: new Date(),
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected: ${authSocket.user?.username}`);
        });
    });
};
