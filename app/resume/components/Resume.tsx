import React from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Link,
  List,
  ListItem,
  Typography,
} from '@mui/material'
import { LinkSummary } from './LinkSummary'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { ResumeSection } from '../types'

type ResumeProps = { resumeData: ResumeSection[] }
export const Resume: React.FC<ResumeProps> = ({ resumeData }: ResumeProps) => {
  return (
    <Box>
      {resumeData.map((section, index) => (
        <Accordion key={index} defaultExpanded={section.defaultExpanded}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">{section.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {section.content.type === 'text' &&
              section.content.textContent?.map((item, i) => (
                <Typography key={i}>
                  {item.label && (
                    <Box component="span" sx={{ fontWeight: 'bold', mr: 1 }}>
                      {item.label}:
                    </Box>
                  )}
                  {item.text}
                </Typography>
              ))}
            {section.content.type === 'list' && (
              <List>
                {section.content.items?.map((item, i) => (
                  <ListItem
                    key={i}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      ml: item.indent,
                    }}
                  >
                    <Typography component={item.link ? Link : 'p'} href={item.link}>
                      {item.text}
                    </Typography>
                    {item.year && (
                      <Typography
                        component={item.yearLink ? Link : 'p'}
                        href={item.yearLink}
                        display={{ xs: 'none', sm: 'block' }}
                      >
                        {item.year}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
            {section.content.type === 'nested' &&
              section.content.nestedSections?.map((nestedSection, i) => (
                <Accordion key={i} expanded={i === 0}>
                  <LinkSummary {...nestedSection} />
                  <AccordionDetails>
                    <List>
                      {nestedSection.details.map((detail, j) =>
                        detail.title ? (
                          <Typography
                            key={j}
                            component={Box}
                            sx={{
                              justifyContent: 'space-between',
                              display: 'flex',
                              my: 3,
                            }}
                          >
                            <Box component="span" sx={{ fontWeight: 'bold' }}>
                              {detail.title}
                            </Box>
                            <Box
                              component="span"
                              sx={{ display: { xs: 'none', md: 'block' } }}
                            >
                              {detail.subTitle}
                            </Box>
                          </Typography>
                        ) : (
                          <ListItem
                            key={j}
                            sx={{
                              pl: Number(detail.indent ? detail.indent : 0) + 2,
                            }}
                          >
                            <Typography>{detail.text}</Typography>
                          </ListItem>
                        )
                      )}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}
