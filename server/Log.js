// Simple console.log helper function to add a timestamp to all logs
module.exports = (str) => 
{
    const date = new Date();
    const timestamp = `${date.getFullYear()}/${date.getMonth()}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    console.log(`[${timestamp}] ${str}`)    
}