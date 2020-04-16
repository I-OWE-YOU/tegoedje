export const main = async event => {
	event.response = { autoConfirmUser: true };
	return event;
};

