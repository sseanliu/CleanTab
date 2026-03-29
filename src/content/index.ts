import { extractMetadata } from './extractor'

const metadata = extractMetadata()
chrome.runtime.sendMessage({ type: 'METADATA_EXTRACTED', payload: metadata })
