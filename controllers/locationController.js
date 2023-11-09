// Dependencies
const { v4: uuidv4 } = require('uuid');

// Create a Map to store active sharingIds and their latest data
const activeSharingIds = new Map();
// Add "update" method
activeSharingIds.update = (key, value) => {
    const oldData = { ...activeSharingIds.get(key) };
    // if (value?.latitude && value?.longitude && oldData?.path) oldData.path.push([value?.latitude, value?.longitude])
    // Check if the array is empty or if the last value is different from the new one
    if (value?.latitude && value?.longitude && oldData?.path && (oldData?.path.length === 0 || (oldData?.path[oldData?.path.length - 1][0] !== value?.latitude || oldData?.path[oldData?.path.length - 1][1] !== value?.longitude))) {
        oldData.path.push([value?.latitude, value?.longitude]);
    }
    updatedData = { ...oldData, ...value };
    activeSharingIds.set(key, updatedData);
    
    return updatedData
}




// Render the share location page
module.exports.renderShareLocation = (req, res) => {
    res.render('share');
}


// Render the watch location page
module.exports.renderWatchLocation = async (req, res) => {
    try {
        const sharingId = req.params.id;
        const locationData = activeSharingIds.get(sharingId);
        if (sharingId && locationData) {
            res.render('watch', { locationData });
        } else {
            res.status(404).send('Location not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
}

// Handle socket connections
module.exports.handleSocketConnection = (socket) => {
    console.log('A user connected');

    // Handle the creation of a new sharing ID
    socket.on('createSharingID', async (data, callback) => {
        // If the same user regenerates a new Sharing ID, delete the previous one
        // if (socket?.sharingId) activeSharingIds.delete(socket.sharingId);
        if (socket?.sharingId) disconnect()
        try {
            // Generate a new unique ID
            let sharingId;
            do { sharingId = uuidv4() } while (activeSharingIds.has(sharingId));
            socket.sharingId = sharingId;

            // Store it in the Map
            activeSharingIds.set(sharingId, { sharingId, latitude: 0, longitude: 0, path: [], active: true });
            callback({ success: true, sharingId });
        } catch (err) {
            console.error(err);
            callback({ success: false, message: 'Sharing ID creation failed' });
        }
    });

    // Update the location and store the latest data in the Map
    socket.on('updateLocation', async (locationData) => {
        try {
            let { sharingId, latitude, longitude, active } = activeSharingIds.update(locationData.sharingId, locationData);
            // Broadcast to clients of the same sharingId
            socket.to(sharingId).emit('watch', { locationData: { sharingId, latitude, longitude, active } });
        } catch (err) {
            console.error(err);
        }
    });

    // Join a room based on the sharingId
    socket.on('join', async ({ sharingId }) => {
        socket.join(sharingId);
    });

    // Handle user disconnection and remove the sharingId from the activeSharingIds Map
    socket.on('disconnect', disconnect);


    // Disconnect function
    function disconnect() {
        console.log('A user disconnected');
        const sharingId = socket.sharingId;
        const locationData = activeSharingIds.update(sharingId, { active: false });
        // Broadcast to clients of the same sharingId
        socket.to(sharingId).emit('watch', { locationData });
        // activeSharingIds.delete(sharingId);
    }
    
}




