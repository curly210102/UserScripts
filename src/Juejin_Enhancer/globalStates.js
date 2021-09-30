const states = {
  userId: "",
};

export function getUserId() {
  return states.userId;
}

export function setUserId(userId) {
  states.userId = userId;
}
