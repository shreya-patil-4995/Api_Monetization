const { v4: uuidv4 } = require('uuid');

const generateApiKey = () => {
    return `spkv_${uuidv4().replace(/-/g, '')}`;
};

module.exports = generateApiKey;
