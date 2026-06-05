const getSubscriptionEndDate = (plan, startDate = new Date()) => {
    const endDate = new Date(startDate);
    
    switch(plan.toLowerCase()) {
        case 'monthly':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case 'yearly':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
        default:
            // default to 1 month
            endDate.setMonth(endDate.getMonth() + 1);
    }
    
    return endDate;
};

const isSubscriptionActive = (endDate) => {
    return new Date() < new Date(endDate);
};

module.exports = {
    getSubscriptionEndDate,
    isSubscriptionActive
};
