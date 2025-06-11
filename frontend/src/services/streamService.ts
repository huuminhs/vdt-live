import axios from 'axios'
import { config } from '../config'

const API_BASE_URL = config.apiBaseUrl

export interface Stream {
  streamId: number
  title: string
  description: string
  status: 'LIVE' | 'ENDED' | 'CREATED'
  creator: string
}

export interface StreamDetailed extends Stream {
  serverId: number
}

export interface StreamsResponse {
  items: Stream[]
  nextCursor: string | null
  hasMore: boolean
}

export interface StreamsParams {
  cursor?: string
  limit?: number
}

export interface CreateStreamRequest {
  title: string
  description: string
}

export interface CreateStreamResponse {
  streamId: number
  streamUrl: string
  mediamtxJwt: string
}

export interface UpdateStreamRequest {
  title: string
  description: string
}

export const streamService = {
  async getStreamById(streamId: number): Promise<StreamDetailed> {
    const response = await axios.get<StreamDetailed>(
      `${API_BASE_URL}/stream/${streamId}`
    )
    
    return response.data
  },

  async getStreams(params: StreamsParams = {}): Promise<StreamsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.cursor) {
      searchParams.append('cursor', params.cursor)
    }

    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }

    const response = await axios.get<StreamsResponse>(
      `${API_BASE_URL}/stream?${searchParams.toString()}`
    )
    
    return response.data
  },

  async getMyStreams(params: StreamsParams = {}, authHeader: string): Promise<StreamsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.cursor) {
      searchParams.append('cursor', params.cursor)
    }

    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }

    const response = await axios.get<StreamsResponse>(
      `${API_BASE_URL}/stream/mine?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': authHeader
        }
      }
    )
    
    return response.data
  },
  async createStream(
    data: CreateStreamRequest, 
    authHeader: string
  ): Promise<CreateStreamResponse> {
    const response = await axios.post<CreateStreamResponse>(
      `${API_BASE_URL}/stream`,
      data,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    )
    
    return response.data
  },

  async updateStream(
    streamId: number,
    data: UpdateStreamRequest, 
    authHeader: string
  ): Promise<void> {
    await axios.put(
      `${API_BASE_URL}/stream/${streamId}`,
      data,
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    )
  },

  async deleteStream(
    streamId: number,
    authHeader: string
  ): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/stream/${streamId}`,
      {
        headers: {
          'Authorization': authHeader
        }
      }
    )
  },

  async getStreamJwt(
    streamId: number,
    authHeader: string
  ): Promise<CreateStreamResponse> {
    const response = await axios.get<CreateStreamResponse>(
      `${API_BASE_URL}/stream/${streamId}/jwt`,
      {
        headers: {
          'Authorization': authHeader
        }
      }
    )
    
    return response.data
  }
}
