import hashlib

class CommitReveal:
    def __init__(self):
        self.commitments = {}  # Stores user commitments (hashed values)

    def commit(self, user, secret):
        """User commits by storing the hash of their secret."""
        secret_str = str(secret)  # Ensure it's a string
        secret_hash = hashlib.sha256(secret_str.encode()).hexdigest()
        self.commitments[user] = secret_hash
        print(f"{user} committed a secret (hash stored).")

    def reveal(self, user, secret):
        """User reveals the secret, and we verify it matches the commitment."""
        if user not in self.commitments:
            print(f"{user} has no commitment.")
            return False

        secret_str = str(secret)
        secret_hash = hashlib.sha256(secret_str.encode()).hexdigest()

        if secret_hash == self.commitments[user]:
            print(f"{user} successfully revealed their secret!")
            return True
        else:
            print(f"Reveal failed: Hash mismatch for {user}.")
            return False

# Example Usage
commit_reveal = CommitReveal()

# Commit Phase
commit_reveal.commit("Alice", 42)
commit_reveal.commit("Bob", 99)

# Reveal Phase
commit_reveal.reveal("Alice", 42)  # Success
commit_reveal.reveal("Bob", 50)    # Failure (wrong secret)
