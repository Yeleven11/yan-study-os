import Foundation

enum SyncAPIError: LocalizedError {
    case invalidURL
    case missingToken
    case unsupportedSchemaVersion(expected: Int, got: Int)
    case unauthorized
    case server(statusCode: Int, message: String)
    case decodingFailed

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Sync server URL is invalid."
        case .missingToken:
            return "Sync token is missing. Add it in app settings."
        case let .unsupportedSchemaVersion(expected, got):
            return "Unsupported payload schema version \(got). Expected \(expected)."
        case .unauthorized:
            return "Unauthorized. Check your mobile bearer token."
        case let .server(statusCode, message):
            return "Server error (\(statusCode)): \(message)"
        case .decodingFailed:
            return "Failed to decode sync response from server."
        }
    }
}

struct SyncAPIClient {
    func send(
        payload: MobileSyncPayload,
        baseURL: URL,
        endpointPath: String,
        bearerToken: String,
        timeoutSeconds: TimeInterval
    ) async throws -> MobileSyncResponse {
        let trimmedToken = bearerToken.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedToken.isEmpty else {
            throw SyncAPIError.missingToken
        }

        guard let url = buildURL(baseURL: baseURL, endpointPath: endpointPath) else {
            throw SyncAPIError.invalidURL
        }
        guard payload.schemaVersion == MobileSyncContract.latestSchemaVersion else {
            throw SyncAPIError.unsupportedSchemaVersion(
                expected: MobileSyncContract.latestSchemaVersion,
                got: payload.schemaVersion
            )
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = timeoutSeconds
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(trimmedToken)", forHTTPHeaderField: "Authorization")
        request.setValue("StudyHealthSync-iOS/1", forHTTPHeaderField: "User-Agent")

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys]
        request.httpBody = try encoder.encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw SyncAPIError.server(statusCode: -1, message: "No HTTP response")
        }

        if http.statusCode == 401 {
            throw SyncAPIError.unauthorized
        }

        guard (200...299).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "Unknown server response"
            throw SyncAPIError.server(statusCode: http.statusCode, message: message)
        }

        do {
            return try JSONDecoder().decode(MobileSyncResponse.self, from: data)
        } catch {
            throw SyncAPIError.decodingFailed
        }
    }

    private func buildURL(baseURL: URL, endpointPath: String) -> URL? {
        guard var components = URLComponents(url: baseURL, resolvingAgainstBaseURL: false) else {
            return nil
        }

        let basePath = components.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let endpoint = endpointPath.trimmingCharacters(in: CharacterSet(charactersIn: "/"))

        let combined: String
        if basePath.isEmpty {
            combined = "/\(endpoint)"
        } else {
            combined = "/\(basePath)/\(endpoint)"
        }

        components.path = combined.replacingOccurrences(of: "//", with: "/")
        return components.url
    }
}
