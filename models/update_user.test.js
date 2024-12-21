const mongoose = require('mongoose');
const { updateUser , User} = require('./User');

describe('updateUser', () => {
  it('should successfully update user with valid data', async () => {
    // Arrange
    const mockUserId = new mongoose.Types.ObjectId();
    const updateData = { name: 'John Doe', email: 'john@example.com' };
    const mockUpdatedUser = { _id: mockUserId, ...updateData };
    User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);

    // Act
    const result = await updateUser(mockUserId, updateData);

    // Assert
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(mockUserId, updateData, { new: true });
    expect(result).toEqual(mockUpdatedUser);
  });

  it('should handle update with partial data', async () => {
    // Arrange
    const mockUserId = new mongoose.Types.ObjectId();
    const updateData = { name: 'Jane Doe' };
    const mockUpdatedUser = { _id: mockUserId, ...updateData };
    User.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedUser);

    // Act
    const result = await updateUser(mockUserId, updateData);

    // Assert
    expect(result).toEqual(mockUpdatedUser);
  });

  it('should return null if user not found', async () => {
    // Arrange
    const mockUserId = new mongoose.Types.ObjectId();
    const updateData = { name: 'John Doe' };
    User.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

    // Act
    const result = await updateUser(mockUserId, updateData);

    // Assert
    expect(result).toBeNull();
  });
});
